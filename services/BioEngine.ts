
import { Neuron, Neurotransmitter, Synapse, BrainStats, ChatMessage, Cluster, SerializedBrain } from "../types";
import { PHYSICS, COLORS, ALPHABET_GRID } from "../constants";

const generateId = () => Math.random().toString(36).substr(2, 9);

export class BioEngine {
  neurons: Neuron[] = [];
  clusters: Cluster[] = [];
  width: number;
  height: number;
  
  // State Flags
  isThinking: boolean = false;
  isFrozen: boolean = false;
  
  lastTick: number = 0;
  frameCount: number = 0;
  
  // For Zoom/Pan reference in stats only
  currentZoom: number = 1;

  // Output Buffering for Sentence Generation
  outputBuffer: string[] = [];
  lastFiredTime: number = 0;
  
  // System Message Buffer
  pendingSystemMessages: ChatMessage[] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.initializeNetwork();
  }

  initializeNetwork() {
    this.neurons = [];
    this.clusters = [];

    // 1. Create Input Cluster (The Keyboard)
    const inputCluster: Cluster = {
      id: 'INPUT',
      label: 'SENSORY (KEYBOARD)',
      x: 0, // Centered relative to view
      y: 0,
      radius: 200,
      color: COLORS.CLUSTER_INPUT,
      targetCount: 40
    };
    this.clusters.push(inputCluster);

    // 2. Create Initial Association Cluster
    const assocCluster: Cluster = {
      id: 'CORE',
      label: 'ASSOCIATION',
      x: 400,
      y: 0,
      radius: 250,
      color: COLORS.CLUSTER_DEFAULT,
      targetCount: 50
    };
    this.clusters.push(assocCluster);

    // 3. Build the Alphabet Grid
    const startX = inputCluster.x - 100;
    const startY = inputCluster.y - 80;
    const gap = 25;

    ALPHABET_GRID.forEach((row, rIdx) => {
      row.forEach((char, cIdx) => {
        this.createNeuron({
          id: `KEY_${char}`,
          regionId: 'INPUT',
          x: startX + cIdx * gap + (rIdx * 10),
          y: startY + rIdx * gap,
          character: char,
          threshold: 10,
        });
      });
    });

    // 4. Fill Core
    for(let i=0; i<20; i++) {
      this.addNeuronToCluster('CORE');
    }

    this.initialWiring();
  }

  createNeuron(partial: Partial<Neuron>): Neuron {
    const n: Neuron = {
      id: partial.id || generateId(),
      regionId: partial.regionId || 'CORE',
      x: partial.x || 0,
      y: partial.y || 0,
      character: partial.character,
      label: partial.label,
      isCompressed: partial.isCompressed || false,
      potential: 0,
      threshold: partial.threshold || PHYSICS.FIRE_THRESHOLD_BASE,
      refractoryPeriod: 0,
      lastFired: 0,
      age: 0,
      stress: 0,
      energy: 1.0,
      neurotransmitters: {
        [Neurotransmitter.Dopamine]: 0.1,
        [Neurotransmitter.Serotonin]: 0.1,
        [Neurotransmitter.Adrenaline]: 0.5,
      },
      connections: []
    };
    this.neurons.push(n);
    return n;
  }

  addNeuronToCluster(clusterId: string, parent?: Neuron) {
    const cluster = this.clusters.find(c => c.id === clusterId);
    if (!cluster) return;

    // Random pos within cluster
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * (cluster.radius * 0.9);
    
    let x, y;
    if (parent) {
      x = parent.x + (Math.random()-0.5)*60;
      y = parent.y + (Math.random()-0.5)*60;
    } else {
      x = cluster.x + Math.cos(angle) * dist;
      y = cluster.y + Math.sin(angle) * dist;
    }

    const n = this.createNeuron({ regionId: clusterId, x, y });
    this.connectNeuron(n);
    
    if (parent) {
      // Bi-directional strong link for context
      parent.connections.push({ targetId: n.id, weight: 3.0, plasticity: 1.0, lastActive: 0 });
      n.connections.push({ targetId: parent.id, weight: 1.0, plasticity: 0.5, lastActive: 0 });
    }
  }

  connectNeuron(source: Neuron) {
    const neighbors = this.neurons.filter(n => {
      if (n.id === source.id) return false;
      const dx = n.x - source.x;
      const dy = n.y - source.y;
      return (dx*dx + dy*dy) < (PHYSICS.CONNECTION_RADIUS ** 2);
    });

    neighbors.forEach(target => {
      if (source.regionId === 'INPUT' && target.regionId === 'INPUT') return; 

      if (Math.random() > 0.7) {
        source.connections.push({
          targetId: target.id,
          weight: Math.random(),
          plasticity: 0.5,
          lastActive: 0
        });
      }
    });
  }

  initialWiring() {
    this.neurons.forEach(n => this.connectNeuron(n));
  }

  // --- SAVE / LOAD SYSTEM ---
  
  exportState(): string {
    const state: SerializedBrain = {
      timestamp: Date.now(),
      clusters: this.clusters,
      neurons: this.neurons
    };
    return JSON.stringify(state);
  }

  importState(json: string) {
    try {
      const state: SerializedBrain = JSON.parse(json);
      if (state.neurons && state.clusters) {
        this.neurons = state.neurons;
        this.clusters = state.clusters;
        console.log("Brain state restored.");
      }
    } catch (e) {
      console.error("Failed to load brain state", e);
    }
  }

  // --- INTERACTION ---

  processInput(text: string) {
    if (this.isFrozen) return;

    // 1. Flash Input Grid (Sensory)
    const upper = text.toUpperCase();
    for (let i = 0; i < upper.length; i++) {
      const char = upper[i];
      const neuron = this.neurons.find(n => n.character === char);
      if (neuron) {
        neuron.potential += 80; 
        neuron.stress += 5; // Reduced stress from simple keystrokes
      }
    }

    // 2. Advanced Tokenization (German support, Punctuation)
    // Matches words (including umlauts) OR punctuation marks as separate tokens
    const tokens = text.match(/[\p{L}\p{N}_]+|[.,!?;:]/gu);
    
    if (!tokens) return;

    let prevConcept: Neuron | undefined;

    tokens.forEach(token => {
        // Find existing concept or create new one
        let concept = this.neurons.find(n => n.label === token);
        
        if (concept) {
            concept.potential += 60; // Higher stimulation
            concept.stress += 15; // Faster growth
            
            // Expansion Logic (More strict now)
            // 1. Threshold increased to 500 (was 100) to prevent explosion
            // 2. Token must be longer than 2 chars (no single letters like 'S', 'T')
            if (concept.stress > 500 && token.length > 2) {
                this.expandRegion(concept);
            }
        } else {
            // New concept learned!
            const core = this.clusters.find(c => c.id === 'CORE');
            if (core) {
                concept = this.createNeuron({
                    regionId: 'CORE',
                    label: token,
                    x: core.x + (Math.random()-0.5)*100,
                    y: core.y + (Math.random()-0.5)*100,
                    threshold: 20
                });
            }
        }

        // 3. Context Wiring (Word -> Word)
        if (prevConcept && concept && prevConcept.id !== concept.id) {
            // Check if connection exists
            const existing = prevConcept.connections.find(c => c.targetId === concept!.id);
            if (!existing) {
                prevConcept.connections.push({
                    targetId: concept.id,
                    weight: 2.5, // Stronger initial connection
                    plasticity: 0.9,
                    lastActive: 0
                });
            } else {
                existing.weight += 1.5; // Reinforce sequence heavily
                existing.plasticity = Math.min(1.0, existing.plasticity + 0.1);
            }
        }
        prevConcept = concept;
    });

    // 4. Run Compression Check
    this.compressPathways();
  }

  // The "Binary" Optimization
  compressPathways() {
     // Find neurons with too many connections and simplify them
     this.neurons.forEach(n => {
         const strongLinks = n.connections.filter(c => c.weight > 5).length;
         if (strongLinks > 8 && !n.isCompressed && n.label && n.label.length > 3) {
             n.isCompressed = true; // Visual change to "Symbol"
             n.energy = 2.0; // High efficiency
             n.threshold = 5; // Low threshold (easy to access)
         }
     });
  }

  expandRegion(seedNeuron: Neuron) {
    if (!seedNeuron.label) return;
    const newClusterId = seedNeuron.label.toUpperCase();
    
    // Don't duplicate
    if (this.clusters.find(c => c.id === newClusterId)) return;

    // Notify User
    this.pendingSystemMessages.push({
        sender: 'SYSTEM',
        text: `NEUES AREAL GEBILDET: ${newClusterId}`,
        timestamp: Date.now()
    });

    // Expand OUTWARDS based on current map size
    const angle = Math.random() * Math.PI * 2;
    const dist = 350 + (this.clusters.length * 80); 
    
    const newCluster: Cluster = {
      id: newClusterId,
      label: newClusterId, 
      x: seedNeuron.x + Math.cos(angle) * dist, // Relative expansion
      y: seedNeuron.y + Math.sin(angle) * dist,
      radius: 120,
      color: COLORS.DYNAMIC_REGIONS[this.clusters.length % COLORS.DYNAMIC_REGIONS.length],
      targetCount: 15
    };

    this.clusters.push(newCluster);

    // Migrate concept neuron physically
    seedNeuron.regionId = newClusterId;
    seedNeuron.x = newCluster.x;
    seedNeuron.y = newCluster.y;
    seedNeuron.stress = 0; // Reset stress

    // Fill with sub-neurons (Deepening knowledge)
    for(let i=0; i<6; i++) {
      this.addNeuronToCluster(newClusterId, seedNeuron);
    }
  }

  startThinking() { this.isThinking = true; this.isFrozen = false; }
  stopThinking() { this.isThinking = false; }
  toggleFreeze() { this.isFrozen = !this.isFrozen; }

  tick(): BrainStats {
    if (this.isFrozen) {
      return {
        neuronCount: this.neurons.length,
        synapseCount: 0,
        clusterCount: this.clusters.length,
        fps: 0,
        mode: 'FROZEN',
        zoomLevel: this.currentZoom
      };
    }

    const now = Date.now();
    this.frameCount++;
    if (now - this.lastTick > 1000) {
      this.lastTick = now;
      this.frameCount = 0;
    }

    let newMessage: ChatMessage | undefined;

    // 0. Flush Pending System Messages (e.g. Region Created)
    if (this.pendingSystemMessages.length > 0) {
        newMessage = this.pendingSystemMessages.shift();
    }

    // THINKING MODE: Random associations
    if (this.isThinking) {
      const concepts = this.neurons.filter(n => n.label);
      if (concepts.length > 0) {
        const rnd = concepts[Math.floor(Math.random() * concepts.length)];
        rnd.potential += 40;
      }
    }

    // Physics Loop
    for (let i = 0; i < this.neurons.length; i++) {
      const n = this.neurons[i];
      n.potential *= 0.92; // Decay
      if (n.refractoryPeriod > 0) n.refractoryPeriod--;

      if (n.potential > n.threshold && n.refractoryPeriod <= 0) {
        n.lastFired = now;
        n.potential = -10;
        n.refractoryPeriod = n.isCompressed ? 2 : 8; // Compressed nodes recover faster
        
        for (const syn of n.connections) {
          const target = this.neurons.find(t => t.id === syn.targetId);
          if (target) {
            target.potential += syn.weight;
            syn.lastActive = now;
            // Strengthen used paths
            if (target.potential > target.threshold) {
              syn.weight = Math.min(10, syn.weight + 0.1); 
            }
          }
        }

        // --- SENTENCE BUFFERING LOGIC ---
        // Only buffer meaningful labels, not raw input characters unless explicitly labelled
        if (n.label && n.regionId !== 'INPUT' && !this.isThinking) {
           this.outputBuffer.push(n.label);
           this.lastFiredTime = now;
        }
      }
    }

    // Check Output Buffer for Silence (End of Thought)
    // Wait 600ms of silence before constructing the sentence
    if (this.outputBuffer.length > 0 && (now - this.lastFiredTime > 600)) {
        
        // 1. Deduplicate consecutive identical words (Stutter removal)
        // e.g. "Hallo Hallo Welt" -> "Hallo Welt"
        const uniqueWords = this.outputBuffer.filter((word, index, arr) => {
            return index === 0 || word !== arr[index - 1];
        });

        // 2. Join words
        let sentence = uniqueWords.join(' ');

        // 3. Fix Punctuation Spacing
        // "Hallo , wie geht es dir ?" -> "Hallo, wie geht es dir?"
        sentence = sentence
            .replace(/\s+([.,!?:;])/g, '$1')  // Remove space before punctuation
            .replace(/([.,!?:;])([a-zA-Z])/g, '$1 $2'); // Ensure space after punctuation

        // Only speak if it's new information and has substance
        // Prevent empty or single-character spam
        if (sentence.length > 1 && !newMessage) {
             // Only output if different from very last output (prevent loops)
             // Simple check, can be expanded
             newMessage = {
                sender: 'SYSTEM',
                text: sentence,
                timestamp: now
            };
        }
        
        this.outputBuffer = []; // Clear buffer
    }

    return {
      neuronCount: this.neurons.length,
      synapseCount: this.neurons.reduce((acc, n) => acc + n.connections.length, 0),
      clusterCount: this.clusters.length,
      fps: this.frameCount,
      latestMessage: newMessage,
      mode: this.isThinking ? 'THINKING' : 'IDLE',
      zoomLevel: this.currentZoom
    };
  }
}
