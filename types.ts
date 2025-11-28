export enum Neurotransmitter {
  Dopamine = 'DOPAMINE',   // Learning/Reward (Plasticity)
  Serotonin = 'SEROTONIN', // Mood/Stability (Inhibition/Threshold)
  Adrenaline = 'ADRENALINE' // Energy/Speed (Excitation)
}

export enum RegionType {
  SensoryInput = 'SENSORY', // Language/Vision (Input)
  Association = 'ASSOCIATION', // Deep processing (Hidden Layers)
  MotorOutput = 'MOTOR' // Action/Result (Output)
}

export interface Synapse {
  targetId: string;
  weight: number; // Strength of connection (0.0 - 5.0)
  plasticity: number; // How easily this connection changes
  lastActive: number; // Timestamp for visualization
}

export interface Neuron {
  id: string;
  region: RegionType;
  x: number;
  y: number;
  
  // Electrical State
  potential: number; // Current charge (-70 to +40 in biology, here 0 to 100)
  threshold: number; // Firing threshold
  refractoryPeriod: number; 
  lastFired: number;
  
  // Biological Metadata
  age: number; 
  stress: number; // Metabolic stress (triggers growth)
  energy: number; // Adenosine Triphosphate (ATP) - simulated by Adrenaline

  // Internal Chemical Balance (Self-regulated)
  neurotransmitters: {
    [Neurotransmitter.Dopamine]: number; // Local plastic potential
    [Neurotransmitter.Serotonin]: number; // Local inhibition
    [Neurotransmitter.Adrenaline]: number; // Local excitability
  };

  connections: Synapse[];
}

// Global stats for the UI, but not control variables
export interface BrainStats {
  neuronCount: number;
  synapseCount: number;
  averageStress: number;
  averageDopamine: number;
  learningCycles: number;
}