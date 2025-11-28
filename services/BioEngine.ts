import { Neuron, Neurotransmitter, RegionType, Synapse, BrainStats } from "../types";
import { PHYSICS, REGION_LAYOUT } from "../constants";

const generateId = () => Math.random().toString(36).substr(2, 9);

export class BioEngine {
  neurons: Neuron[] = [];
  width: number;
  height: number;
  lastTick: number = 0;
  frameCount: number = 0;
  fps: number = 60;
  
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.initializeNetwork();
  }

  initializeNetwork() {
    this.neurons = [];
    Object.keys(REGION_LAYOUT).forEach(rType => {
      // Initialize sparse clusters
      for (let i = 0; i < 15; i++) {
        this.addNeuron(rType as RegionType);
      }
    });
    this.initialWiring();
  }

  addNeuron(region: RegionType, parent?: Neuron) {
    if (this.neurons.length >= PHYSICS.MAX_NEURONS) return;

    const layout = REGION_LAYOUT[region];
    const centerX = layout.x * this.width;
    const centerY = layout.y * this.height;

    // Organic spread
    let x, y;
    if (parent) {
        // Grow outward from parent
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 40;
        x = parent.x + Math.cos(angle) * dist;
        y = parent.y + Math.sin(angle) * dist;
    } else {
        // Initial cluster
        x = centerX + (Math.random() - 0.5) * 150;
        y = centerY + (Math.random() - 0.5) * 150;
    }

    // Boundary check
    x = Math.max(10, Math.min(this.width - 10, x));
    y = Math.max(10, Math.min(this.height - 10, y));

    const newNeuron: Neuron = {
      id: generateId(),
      region,
      x, y,
      potential: 0,
      threshold: PHYSICS.FIRE_THRESHOLD_BASE,
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

    this.neurons.push(newNeuron);
    
    // Connect to nearby neurons immediately
    this.connectNeuron(newNeuron);
  }

  connectNeuron(source: Neuron) {
    // Find neighbors
    const neighbors = this.neurons.filter(n => {
        if (n.id === source.id) return false;
        const dx = n.x - source.x;
        const dy = n.y - source.y;
        return (dx*dx + dy*dy) < (PHYSICS.CONNECTION_RADIUS * PHYSICS.CONNECTION_RADIUS);
    });

    neighbors.forEach(target => {
        // Logic: Inputs -> Association -> Output
        // Rarely connect backwards (feedback loops)
        let canConnect = false;

        if (source.region === target.region) canConnect = true;
        
        if ((source.region === RegionType.SensoryInput || source.region === RegionType.VisualInput) 
             && target.region === RegionType.Association) canConnect = true;

        if (source.region === RegionType.Association && target.region === RegionType.MotorOutput) canConnect = true;

        if (canConnect && Math.random() > 0.3) {
             source.connections.push({
                 targetId: target.id,
                 weight: 0.5 + Math.random(), // Random initial weight
                 plasticity: 0.8,
                 lastActive: 0
             });
        }
    });
  }

  initialWiring() {
      this.neurons.forEach(n => this.connectNeuron(n));
  }

  /**
   * Process raw text/audio input
   */
  processTextInput(text: string) {
    const inputNeurons = this.neurons.filter(n => n.region === RegionType.SensoryInput);
    if (inputNeurons.length === 0) return;

    // Deterministic hashing of input to specific neurons
    // This ensures "Apple" always stimulates the same initial neurons
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Select neurons based on hash
    const targetIndex = Math.abs(hash) % inputNeurons.length;
    const targetNeuron = inputNeurons[targetIndex];

    // Stimulate
    targetNeuron.potential += 80;
    targetNeuron.neurotransmitters[Neurotransmitter.Adrenaline] += 0.5;
    
    // Stimulate neighbors slightly (associative area)
    this.stimulateRadius(targetNeuron.x, targetNeuron.y, 30, 20);
  }

  /**
   * Process Image Data (Pixel array)
   * This is a simplified "Visual Cortex" simulation
   */
  processVisualInput(pixelData: Uint8ClampedArray, width: number, height: number) {
      const visualNeurons = this.neurons.filter(n => n.region === RegionType.VisualInput);
      if (visualNeurons.length === 0) return;

      // Map pixel brightness to neuron potential
      // We sample the image grid loosely
      visualNeurons.forEach(n => {
          // Determine where this neuron sits relative to region bounds
          // This is a rough mapping of "retina" to "visual cortex"
          // In a real app we'd need normalized coordinates
          
          // Randomly exciting for now based on total brightness to simulate 'seeing' something
          // Real mapping would require normalized neuron coordinates 0..1
          if (Math.random() > 0.5) {
              n.potential += 50;
              n.stress += 5;
          }
      });
  }

  stimulateRadius(x: number, y: number, r: number, amount: number) {
      this.neurons.forEach(n => {
          const dx = n.x - x;
          const dy = n.y - y;
          if ((dx*dx + dy*dy) < r*r) {
              n.potential += amount;
          }
      });
  }

  tick(): BrainStats {
    const now = Date.now();
    let totalInputActivity = 0;
    let totalOutputActivity = 0;
    
    // FPS Calc
    if (now - this.lastTick > 1000) {
        this.lastTick = now;
        this.frameCount = 0;
    }
    this.frameCount++;

    // --- Main Neuron Loop ---
    // Using a for-loop is faster than forEach for thousands of items
    for (let i = 0; i < this.neurons.length; i++) {
        const neuron = this.neurons[i];
        
        // 1. Biological Housekeeping
        neuron.age++;
        neuron.potential *= 0.92; // Electrical decay
        
        // Recover energy
        if (neuron.energy < 1.0) neuron.energy += 0.002;

        // 2. Refractory Period
        if (neuron.refractoryPeriod > 0) {
            neuron.refractoryPeriod--;
            continue;
        }

        // 3. Fire Logic
        if (neuron.potential > neuron.threshold) {
            // FIRE!
            neuron.lastFired = now;
            neuron.potential = -20; // Hyperpolarization
            neuron.refractoryPeriod = 4;
            neuron.energy -= 0.05;
            neuron.stress += 1; // Activity causes structural stress

            // Activity Stats
            if (neuron.region === RegionType.MotorOutput) totalOutputActivity++;
            if (neuron.region === RegionType.SensoryInput) totalInputActivity++;

            // Propagate
            for (let j = 0; j < neuron.connections.length; j++) {
                const syn = neuron.connections[j];
                const target = this.neurons.find(n => n.id === syn.targetId);
                if (target) {
                    target.potential += syn.weight;
                    syn.lastActive = now;
                    
                    // Hebbian Learning:
                    // If target is already excited (potential high), strengthen connection
                    if (target.potential > 10) {
                        syn.weight = Math.min(10, syn.weight + (0.1 * syn.plasticity));
                    }
                }
            }

            // Neurogenesis (Expansion)
            // If stress is high, the brain region expands physically
            if (neuron.stress > 100) {
                this.addNeuron(neuron.region, neuron); // Budding
                neuron.stress = 0;
                // Cost of growth
                neuron.neurotransmitters[Neurotransmitter.Dopamine] += 1;
            }
        }

        // 4. Structural Plasticity (Decay/Pruning)
        // Only prune connections that are extremely weak and old
        // We do NOT decommission based on simple time anymore
        for (let j = neuron.connections.length - 1; j >= 0; j--) {
            const syn = neuron.connections[j];
            
            // Very slow decay of unused paths
            if (now - syn.lastActive > 2000) {
                syn.weight *= 0.999; 
            }

            if (syn.weight < 0.05) {
                neuron.connections.splice(j, 1); // Prune
            }
        }
    }

    return {
        neuronCount: this.neurons.length,
        synapseCount: this.neurons.reduce((a, b) => a + b.connections.length, 0),
        inputActivity: totalInputActivity,
        outputActivity: totalOutputActivity,
        fps: this.frameCount
    };
  }
}