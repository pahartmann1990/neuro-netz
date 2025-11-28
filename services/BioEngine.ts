import { Neuron, Neurotransmitter, RegionType, Synapse, BrainStats } from "../types";
import { PHYSICS, REGION_LAYOUT } from "../constants";

const generateId = () => Math.random().toString(36).substr(2, 9);

export class BioEngine {
  neurons: Neuron[] = [];
  width: number;
  height: number;
  learningCycles: number = 0;
  
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.initializeNetwork();
  }

  initializeNetwork() {
    this.neurons = [];
    // Start with a small functional cluster in each region
    Object.values(RegionType).forEach(region => {
      // Create seed neurons
      for (let i = 0; i < 8; i++) {
        this.addNeuron(region as RegionType);
      }
    });
    this.initialWiring();
  }

  // Load from save state
  loadState(savedNeurons: Neuron[]) {
      this.neurons = savedNeurons;
  }

  addNeuron(region: RegionType, parent?: Neuron) {
    if (this.neurons.length >= PHYSICS.MAX_NEURONS) return;

    const layout = REGION_LAYOUT[region];
    const centerX = layout.x * this.width;
    const centerY = layout.y * this.height;

    // Position logic: heavily clustered around region center or parent
    let x, y;
    if (parent) {
        x = parent.x + (Math.random() - 0.5) * 40;
        y = parent.y + (Math.random() - 0.5) * 40;
    } else {
        x = centerX + (Math.random() - 0.5) * 100;
        y = centerY + (Math.random() - 0.5) * 100;
    }

    const newNeuron: Neuron = {
      id: generateId(),
      region,
      x: Math.max(20, Math.min(this.width - 20, x)),
      y: Math.max(20, Math.min(this.height - 20, y)),
      potential: 0,
      threshold: 15, // Standard threshold
      refractoryPeriod: 0,
      lastFired: 0,
      age: 0,
      stress: 0,
      energy: 1.0, // Full energy
      neurotransmitters: {
        [Neurotransmitter.Dopamine]: 0.1, // Starts low, builds with success
        [Neurotransmitter.Serotonin]: 0.1,
        [Neurotransmitter.Adrenaline]: 0.5,
      },
      connections: []
    };

    this.neurons.push(newNeuron);
    this.connectNeuron(newNeuron);
  }

  initialWiring() {
      this.neurons.forEach(n => this.connectNeuron(n));
  }

  connectNeuron(source: Neuron) {
    // Determine connection candidates based on proximity and region
    const candidates = this.neurons.filter(target => target.id !== source.id);
    
    candidates.forEach(target => {
      const dx = source.x - target.x;
      const dy = source.y - target.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rules:
      // 1. Sensory connects to Association
      // 2. Association connects to Motor
      // 3. Intra-region connections allow processing
      // 4. Backward connections (Motor -> Sensory) are rare (feedback loops)

      let allowConnection = false;
      let maxDist = PHYSICS.CONNECTION_RADIUS;

      if (source.region === target.region) {
          allowConnection = true; // High connectivity within regions
      } else if (source.region === RegionType.SensoryInput && target.region === RegionType.Association) {
          allowConnection = true;
          maxDist = 300; // Long axons
      } else if (source.region === RegionType.Association && target.region === RegionType.MotorOutput) {
          allowConnection = true;
          maxDist = 300;
      }

      if (allowConnection && dist < maxDist) {
        // Don't duplicate
        if (!source.connections.find(c => c.targetId === target.id)) {
            // Chance to connect
            if (Math.random() > 0.4) {
                source.connections.push({
                    targetId: target.id,
                    weight: Math.random() * 0.5, // Start weak
                    plasticity: 0.5,
                    lastActive: 0
                });
            }
        }
      }
    });
  }

  /**
   * Translates text input into electrical impulses
   * Mapping ASCII codes to specific Sensory Neurons
   */
  processInput(text: string) {
    const sensoryNeurons = this.neurons.filter(n => n.region === RegionType.SensoryInput);
    if (sensoryNeurons.length === 0) return;

    // Sort to make mapping deterministic
    sensoryNeurons.sort((a, b) => a.y - b.y);

    const chars = text.split('');
    chars.forEach((char, charIdx) => {
        const code = char.charCodeAt(0);
        
        // Map bits of the character to neurons
        // A character has 8 bits, we try to map them to 8 sensory clusters
        for (let i = 0; i < 8; i++) {
            const bit = (code >> i) & 1;
            if (bit === 1) {
                // If we have enough neurons, target specific ones. If not, modulo.
                const targetIdx = (charIdx + i) % sensoryNeurons.length;
                const target = sensoryNeurons[targetIdx];
                
                // --- MASSIVE INPUT SHOCK ---
                target.potential += 50; // Immediate huge spike
                target.energy = 1.0; // Input gives energy
                target.neurotransmitters[Neurotransmitter.Adrenaline] += 0.2; // Input causes excitement
                target.stress += 5; // Input causes stress (growth trigger)
            }
        }
    });
    
    this.learningCycles++;
  }

  /**
   * Main Simulation Loop (Autonomous)
   */
  tick(): BrainStats {
    const now = Date.now();
    let firedCount = 0;
    let totalStress = 0;
    let totalDopamine = 0;

    // 1. Update Neurons (Chemical & Electrical)
    this.neurons.forEach(neuron => {
        neuron.age++;
        
        // --- AUTONOMOUS HOMEOSTASIS ---
        
        // Adrenaline (Energy) Recovery
        // If not firing, energy replenishes slowly
        neuron.energy = Math.min(1.0, neuron.energy + 0.005);
        
        // Serotonin (Regulation)
        // If stress is high, Serotonin rises to calm down
        if (neuron.stress > 20) {
            neuron.neurotransmitters[Neurotransmitter.Serotonin] += 0.01;
        } else {
            neuron.neurotransmitters[Neurotransmitter.Serotonin] *= 0.99; // Decay
        }

        // Dopamine (Plasticity)
        // Decays slowly if not reinforced
        neuron.neurotransmitters[Neurotransmitter.Dopamine] *= 0.995;


        // --- ELECTRICAL PHYSICS ---
        
        // Potential Decay (Leakage)
        neuron.potential *= 0.90;

        // Refractory Period
        if (neuron.refractoryPeriod > 0) {
            neuron.refractoryPeriod--;
            return;
        }

        // Threshold Calculation
        // Serotonin increases threshold (makes it harder to fire)
        // Adrenaline lowers threshold (makes it easier)
        const currentThreshold = neuron.threshold 
            + (neuron.neurotransmitters[Neurotransmitter.Serotonin] * 20) 
            - (neuron.neurotransmitters[Neurotransmitter.Adrenaline] * 5);

        // FIRE LOGIC
        if (neuron.potential >= currentThreshold && neuron.energy > 0.1) {
            this.fireNeuron(neuron, now);
            firedCount++;
        }

        // GROWTH LOGIC (Neurogenesis)
        // If stress is very high, spawn a helper neuron
        if (neuron.stress > 50 && this.neurons.length < PHYSICS.MAX_NEURONS) {
            this.addNeuron(neuron.region, neuron);
            neuron.stress = 0; // Relief
            neuron.neurotransmitters[Neurotransmitter.Dopamine] += 0.5; // Growth feels good
        }
        
        // Stress decay
        neuron.stress *= 0.98;
        
        // Stats aggregation
        totalStress += neuron.stress;
        totalDopamine += neuron.neurotransmitters[Neurotransmitter.Dopamine];
    });

    return {
        neuronCount: this.neurons.length,
        synapseCount: this.neurons.reduce((acc, n) => acc + n.connections.length, 0),
        averageStress: totalStress / (this.neurons.length || 1),
        averageDopamine: totalDopamine / (this.neurons.length || 1),
        learningCycles: this.learningCycles
    };
  }

  fireNeuron(neuron: Neuron, now: number) {
      neuron.lastFired = now;
      neuron.potential = 0; // Reset
      neuron.energy -= 0.15; // Consume energy
      neuron.refractoryPeriod = 5; // Brief rest
      neuron.stress += 2; // Firing adds wear and tear

      // Signal Propagation
      neuron.connections.forEach(synapse => {
          const target = this.neurons.find(n => n.id === synapse.targetId);
          if (target) {
              // Signal Strength = Synapse Weight + Source Adrenaline
              const signalStrength = (synapse.weight * 5) + (neuron.neurotransmitters[Neurotransmitter.Adrenaline] * 10);
              target.potential += signalStrength;
              synapse.lastActive = now;

              // HEBBIAN LEARNING (Wire together, fire together)
              // If target fired recently, strengthen connection
              if (now - target.lastFired < 100) {
                  synapse.weight = Math.min(3.0, synapse.weight + 0.1);
                  synapse.plasticity = 1.0;
                  // Release Dopamine (Reward)
                  neuron.neurotransmitters[Neurotransmitter.Dopamine] += 0.1;
                  target.neurotransmitters[Neurotransmitter.Dopamine] += 0.1;
              }
          }
      });
  }

  /**
   * Manually trigger a "click" stimulation
   */
  stimulateArea(x: number, y: number) {
      this.neurons.forEach(n => {
          const dx = n.x - x;
          const dy = n.y - y;
          if (Math.sqrt(dx*dx + dy*dy) < 50) {
              n.potential += 50;
              n.stress += 10;
          }
      });
  }
}