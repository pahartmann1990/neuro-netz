
import { Neuron, Neurotransmitter, Synapse, BrainStats, ChatMessage, Cluster, SerializedBrain } from "../types";
import { PHYSICS, COLORS, ALPHABET_GRID, COMMON_WORDS_DE, COMMON_WORDS_EN } from "../constants";

const generateId = () => Math.random().toString(36).substr(2, 9);

export class BioEngine {
  neurons: Neuron[] = [];
  clusters: Cluster[] = [];
  width: number;
  height: number;
  
  isThinking: boolean = false;
  isFrozen: boolean = false;
  isSleeping: boolean = false;
  
  lastTick: number = 0;
  frameCount: number = 0;
  currentZoom: number = 1;

  outputBuffer: string[] = [];
  lastFiredTime: number = 0;
  lastActivePath: string[] = []; // Track IDs of recently fired neurons for Reinforcement Learning
  pendingSystemMessages: ChatMessage[] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.initializeNetwork();
  }

  initializeNetwork() {
    this.neurons = [];
    this.setupClusters();

    // Build Keyboard
    const startX = PHYSICS.ZONE_SENSORY_X - 100;
    const startY = -200;
    const gap = 30;

    ALPHABET_GRID.forEach((row, rIdx) => {
      row.forEach((char, cIdx) => {
        this.createNeuron({
          id: `KEY_${char}`,
          regionId: 'SENSORY',
          x: startX + cIdx * gap + (rIdx * 15),
          y: startY + rIdx * gap,
          character: char,
          threshold: 15,
        });
      });
    });

    // Build Visual Retina (Simulated)
    const retinaX = PHYSICS.ZONE_SENSORY_X - 50;
    const retinaY = 100;
    for(let i=0; i<100; i++) { // 10x10 grid
        const row = Math.floor(i / 10);
        const col = i % 10;
        this.createNeuron({
            id: `PIXEL_${i}`,
            regionId: 'SENSORY',
            x: retinaX + col * 15,
            y: retinaY + row * 15,
            pixelIndex: i,
            threshold: 20
        });
    }
  }

  setupClusters() {
    this.clusters = [
      {
        id: 'SENSORY',
        label: 'SENSORY INPUT',
        x: PHYSICS.ZONE_SENSORY_X,
        y: 0,
        radius: 250,
        color: COLORS.CLUSTER_SENSORY,
        targetCount: 140
      },
      {
        id: 'LANG_DE',
        label: 'GERMAN LANG',
        x: PHYSICS.ZONE_LANGUAGE_X,
        y: -150,
        radius: 180,
        color: COLORS.CLUSTER_GERMAN,
        targetCount: 0
      },
      {
        id: 'LANG_EN',
        label: 'ENGLISH LANG',
        x: PHYSICS.ZONE_LANGUAGE_X,
        y: 150,
        radius: 180,
        color: COLORS.CLUSTER_ENGLISH,
        targetCount: 0
      },
      {
        id: 'MEMORY',
        label: 'CONCEPT STORAGE',
        x: PHYSICS.ZONE_MEMORY_X,
        y: 0,
        radius: 350,
        color: COLORS.CLUSTER_MEMORY,
        targetCount: 0
      }
    ];
  }

  createNeuron(partial: Partial<Neuron>): Neuron {
    const n: Neuron = {
      id: partial.id || generateId(),
      regionId: partial.regionId || 'MEMORY',
      x: partial.x || 0,
      y: partial.y || 0,
      character: partial.character,
      label: partial.label,
      pixelIndex: partial.pixelIndex,
      isCompressed: partial.isCompressed || false,
      potential: 0,
      threshold: partial.threshold || PHYSICS.FIRE_THRESHOLD_BASE,
      refractoryPeriod: 0,
      lastFired: 0,
      age: 0,
      stress: 0,
      energy: 1.0,
      neurotransmitters: {},
      connections: []
    };
    this.neurons.push(n);
    return n;
  }

  // --- REINFORCEMENT LEARNING ---

  applyReinforcement(type: 'REWARD' | 'PUNISH') {
      const now = Date.now();
      const rewardWindow = 5000; // Affect things fired in last 5 seconds

      let affected = 0;

      this.neurons.forEach(n => {
          if (now - n.lastFired < rewardWindow) {
              if (type === 'REWARD') {
                  // DOPAMINE: Strengthen connections entering this active neuron
                  n.potential += 50; // Burst of joy
                  this.neurons.forEach(source => {
                      const conn = source.connections.find(c => c.targetId === n.id);
                      if (conn && (now - conn.lastActive < rewardWindow)) {
                          conn.weight += 2.0; // Permanent Boost
                          conn.plasticity += 0.1; // Makes it easier to learn more
                          affected++;
                      }
                  });
              } else {
                  // CORTISOL: Weaken/Kill connections
                  n.potential = -50; // Depression/Inhibition
                  n.stress += 50;
                  this.neurons.forEach(source => {
                      const conn = source.connections.find(c => c.targetId === n.id);
                      if (conn && (now - conn.lastActive < rewardWindow)) {
                          conn.weight -= 5.0; // Massive penalty
                          if (conn.weight <= 0) {
                              source.connections = source.connections.filter(c => c !== conn); // Prune immediately
                          }
                          affected++;
                      }
                  });
              }
          }
      });

      this.pendingSystemMessages.push({
          sender: 'SYSTEM',
          text: type === 'REWARD' ? `LOB ERHALTEN. ${affected} Synapsen verstärkt.` : `KRITIK ERHALTEN. ${affected} Synapsen geschwächt.`,
          timestamp: now
      });
  }

  // --- DEEP SLEEP (OPTIMIZATION) ---
  
  consolidateMemory() {
      this.isSleeping = true;
      let merges = 0;
      let pruned = 0;

      // 1. Pruning: Remove weak unused connections
      this.neurons.forEach(n => {
          const oldLen = n.connections.length;
          n.connections = n.connections.filter(c => c.weight > 1.0);
          pruned += (oldLen - n.connections.length);
      });

      // 2. Compression: Find strong chains A->B and make A->AB->B symbol
      // Simplified: If A connects STRONGLY to B, merge them conceptually
      // For this demo, we just prune standalone neurons without connections
      const orphans = this.neurons.filter(n => 
          n.connections.length === 0 && 
          !this.neurons.some(other => other.connections.some(c => c.targetId === n.id)) &&
          n.regionId !== 'SENSORY'
      );
      
      this.neurons = this.neurons.filter(n => !orphans.includes(n));
      merges = orphans.length;

      // 3. Re-positioning (Gravity to cluster center)
      this.neurons.forEach(n => {
          let targetX = n.x;
          if (n.regionId === 'LANG_DE') targetX = PHYSICS.ZONE_LANGUAGE_X;
          else if (n.regionId === 'MEMORY') targetX = PHYSICS.ZONE_MEMORY_X;
          
          // Pull towards center
          n.x += (targetX - n.x) * 0.1;
      });

      this.pendingSystemMessages.push({
          sender: 'SYSTEM',
          text: `SCHLAF BEENDET. ${pruned} tote Synapsen entfernt. ${merges} isolierte Neuronen gelöscht.`,
          timestamp: Date.now()
      });
      
      setTimeout(() => { this.isSleeping = false; }, 2000);
  }

  // --- INPUT PROCESSING ---

  processVisualInput(imageData: Uint8Array) {
      // imageData is expected to be a 100-length array (10x10 grid) of brightness values
      for(let i=0; i<Math.min(imageData.length, 100); i++) {
          const brightness = imageData[i];
          if (brightness > 128) {
              const pixelNeuron = this.neurons.find(n => n.id === `PIXEL_${i}`);
              if (pixelNeuron) {
                  pixelNeuron.potential += 50;
                  pixelNeuron.lastFired = Date.now();
              }
          }
      }
  }

  determineRegionForWord(word: string): string {
    const upper = word.toUpperCase();
    if (COMMON_WORDS_DE.includes(upper)) return 'LANG_DE';
    if (COMMON_WORDS_EN.includes(upper)) return 'LANG_EN';
    if (word.length <= 4) return 'LANG_DE'; 
    return 'MEMORY';
  }

  processInput(text: string) {
    if (this.isFrozen) return;

    // Sensory Flash
    const upper = text.toUpperCase();
    for (let i = 0; i < upper.length; i++) {
      const char = upper[i];
      const neuron = this.neurons.find(n => n.character === char);
      if (neuron) {
        neuron.potential += 40; 
        neuron.stress += 1;
      }
    }

    const tokens = text.match(/[\p{L}\p{N}_]+|[.,!?;:]/gu);
    if (!tokens) return;

    let prevNeuron: Neuron | undefined;

    tokens.forEach(token => {
        const isPunctuation = /[.,!?;:]/.test(token);
        let neuron = this.neurons.find(n => n.label === token);
        
        if (!neuron) {
            let targetRegion = 'MEMORY';
            let threshold = PHYSICS.FIRE_THRESHOLD_BASE;

            if (isPunctuation) {
                targetRegion = 'LANG_DE'; 
                threshold = PHYSICS.FIRE_THRESHOLD_PUNCTUATION; 
            } else {
                targetRegion = this.determineRegionForWord(token);
            }

            let zoneX = PHYSICS.ZONE_MEMORY_X;
            let zoneY = 0;
            
            if (targetRegion === 'LANG_DE') { zoneX = PHYSICS.ZONE_LANGUAGE_X; zoneY = -100; }
            else if (targetRegion === 'LANG_EN') { zoneX = PHYSICS.ZONE_LANGUAGE_X; zoneY = 100; }
            
            neuron = this.createNeuron({
                label: token,
                regionId: targetRegion,
                x: zoneX + (Math.random()-0.5) * 200,
                y: zoneY + (Math.random()-0.5) * 200,
                threshold: threshold
            });
        } else {
            neuron.stress += 10;
            neuron.potential += 30;
            if (isPunctuation) neuron.threshold = PHYSICS.FIRE_THRESHOLD_PUNCTUATION;
        }

        if (prevNeuron && prevNeuron.id !== neuron.id) {
            this.strengthenConnection(prevNeuron, neuron);
        }
        prevNeuron = neuron;
    });
  }

  checkConnectionValidity(source: Neuron, target: Neuron): boolean {
    if (source.id === target.id) return false;
    const getLevel = (rid: string) => {
        if (rid === 'SENSORY') return 1;
        if (rid.startsWith('LANG')) return 2;
        if (rid === 'MEMORY') return 3;
        return 99; 
    };
    const l1 = getLevel(source.regionId);
    const l2 = getLevel(target.regionId);

    // Strict Forward Flow: 1->2->3. 
    // Allow lateral (2->2, 3->3).
    // Allow Feedback only for Reinforcement (handled separately) or direct Associations
    if (l2 < l1) return false; // No back-prop in standard creation
    return true;
  }

  strengthenConnection(source: Neuron, target: Neuron) {
      if (!this.checkConnectionValidity(source, target)) return;

      let connection = source.connections.find(c => c.targetId === target.id);
      if (!connection) {
          source.connections.push({
              targetId: target.id,
              weight: 2.0,
              plasticity: 0.5,
              lastActive: Date.now()
          });
      } else {
          connection.weight += 2.0;
          connection.lastActive = Date.now();
      }
  }

  exportState(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      clusters: this.clusters,
      neurons: this.neurons
    });
  }

  importState(json: string) {
    try {
      const state: SerializedBrain = JSON.parse(json);
      if (state.neurons) {
          this.setupClusters(); 
          this.neurons = state.neurons;

          this.neurons.forEach(n => {
              let newRegion = 'MEMORY'; 
              
              if (n.character || n.pixelIndex !== undefined) newRegion = 'SENSORY';
              else if (n.label) {
                  const isPunct = /[.,!?;:]/.test(n.label);
                  if (isPunct) newRegion = 'LANG_DE'; 
                  else {
                      newRegion = this.determineRegionForWord(n.label);
                  }
              }

              n.regionId = newRegion;

              let targetX = PHYSICS.ZONE_MEMORY_X;
              if (newRegion === 'SENSORY') targetX = PHYSICS.ZONE_SENSORY_X;
              if (newRegion.startsWith('LANG')) targetX = PHYSICS.ZONE_LANGUAGE_X;
              
              if (Math.abs(n.x - targetX) > 300) {
                  n.x = targetX + (Math.random() - 0.5) * 200;
              }
              
              if (n.label && /[.,!?;:]/.test(n.label)) {
                  n.threshold = PHYSICS.FIRE_THRESHOLD_PUNCTUATION;
              } else {
                  n.threshold = PHYSICS.FIRE_THRESHOLD_BASE;
              }
          });
          
          this.pendingSystemMessages.push({
             sender: 'SYSTEM',
             text: `System Loaded. Optimized architecture V7 applied.`,
             timestamp: Date.now() 
          });
      }
    } catch (e) { console.error(e); }
  }

  startThinking() { this.isThinking = true; }
  stopThinking() { this.isThinking = false; }
  toggleFreeze() { this.isFrozen = !this.isFrozen; }

  tick(): BrainStats {
    if (this.isFrozen) return { neuronCount: this.neurons.length, synapseCount: 0, clusterCount: 4, fps: 0, mode: 'FROZEN', zoomLevel: 1 };

    const now = Date.now();
    this.frameCount++;
    if (now - this.lastTick > 1000) {
      this.lastTick = now;
      this.frameCount = 0;
    }

    if (this.isThinking && !this.isSleeping) {
        const memoryNodes = this.neurons.filter(n => n.regionId === 'MEMORY');
        if (memoryNodes.length > 0) {
            for(let i=0; i<3; i++) {
                const rnd = memoryNodes[Math.floor(Math.random() * memoryNodes.length)];
                rnd.potential += 35; 
            }
        }
    }

    let newMessage: ChatMessage | undefined;
    if (this.pendingSystemMessages.length > 0) newMessage = this.pendingSystemMessages.shift();

    this.lastActivePath = [];

    for (const n of this.neurons) {
      n.potential *= 0.94; 
      if (n.refractoryPeriod > 0) n.refractoryPeriod--;

      if (n.potential > n.threshold && n.refractoryPeriod <= 0) {
        n.lastFired = now;
        n.potential = -20; 
        n.refractoryPeriod = 5; 
        
        if (n.regionId !== 'SENSORY') {
            this.lastActivePath.push(n.id); // Track for reinforcement
        }

        for (const syn of n.connections) {
          const target = this.neurons.find(t => t.id === syn.targetId);
          if (target) {
            target.potential += syn.weight;
            syn.lastActive = now;
          }
        }

        if (n.label && n.regionId !== 'SENSORY') {
            this.outputBuffer.push(n.label);
            this.lastFiredTime = now;
        }
      }
    }

    if (this.outputBuffer.length > 0 && (now - this.lastFiredTime > 400)) {
        const unique = this.outputBuffer.filter((w, i, a) => i===0 || w !== a[i-1]);
        
        let text = unique.join(' ')
            .replace(/\s+([.,!?:;])/g, '$1') 
            .replace(/([.,!?:;])([a-zA-Z])/g, '$1 $2');
            
        if (text.length > 1 && !newMessage) {
            newMessage = { sender: 'SYSTEM', text, timestamp: now };
        }
        this.outputBuffer = [];
    }

    return {
      neuronCount: this.neurons.length,
      synapseCount: this.neurons.reduce((a, b) => a + b.connections.length, 0),
      clusterCount: 4, 
      fps: this.frameCount,
      latestMessage: newMessage,
      mode: this.isSleeping ? 'SLEEPING' : (this.isThinking ? 'THINKING' : 'IDLE'),
      zoomLevel: this.currentZoom
    };
  }
}
