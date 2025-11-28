export enum Neurotransmitter {
  Dopamine = 'DOPAMINE',   // Learning/Reward (Plasticity)
  Serotonin = 'SEROTONIN', // Mood/Stability (Inhibition/Threshold)
  Adrenaline = 'ADRENALINE' // Energy/Speed (Excitation)
}

export enum RegionType {
  SensoryInput = 'SENSORY', // Text/Audio Language Input
  VisualInput = 'VISUAL',   // Image Input
  Association = 'ASSOCIATION', // Processing
  MotorOutput = 'MOTOR' // Result/Action
}

export interface Synapse {
  targetId: string;
  weight: number; // Strength (0.0 - 10.0)
  plasticity: number;
  lastActive: number;
}

export interface Neuron {
  id: string;
  region: RegionType;
  x: number;
  y: number;
  
  // Electrical State
  potential: number; 
  threshold: number; 
  refractoryPeriod: number; 
  lastFired: number;
  
  // Biological Metadata
  age: number; 
  stress: number; 
  energy: number; 

  // Internal Chemical Balance
  neurotransmitters: {
    [Neurotransmitter.Dopamine]: number;
    [Neurotransmitter.Serotonin]: number;
    [Neurotransmitter.Adrenaline]: number;
  };

  connections: Synapse[];
}

export interface BrainStats {
  neuronCount: number;
  synapseCount: number;
  inputActivity: number; // Visualizes input strength
  outputActivity: number; // Visualizes output strength
  fps: number;
}