
export enum Neurotransmitter {
  Dopamine = 'DOPAMINE', // Reward
  Serotonin = 'SEROTONIN', // Mood/Stability
  Adrenaline = 'ADRENALINE', // Energy
  Cortisol = 'CORTISOL' // Punishment/Pruning
}

export type RegionId = string;

export interface Cluster {
  id: RegionId;
  label: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  targetCount: number; 
}

export interface Synapse {
  targetId: string;
  weight: number; 
  plasticity: number;
  lastActive: number;
  isShortcut?: boolean;
}

export interface Neuron {
  id: string;
  regionId: RegionId; 
  x: number;
  y: number;
  label?: string; 
  character?: string; 
  pixelIndex?: number; // For Visual Input (0-99)
  isCompressed?: boolean; // Represents a merged concept
  
  potential: number; 
  threshold: number; 
  refractoryPeriod: number; 
  lastFired: number;
  
  age: number; 
  stress: number; 
  energy: number; 

  neurotransmitters: {
    [key in Neurotransmitter]?: number;
  };

  connections: Synapse[];
}

export interface ChatMessage {
  sender: 'USER' | 'SYSTEM' | 'SELF';
  text: string;
  timestamp: number;
  isCorrection?: boolean;
}

export interface BrainStats {
  neuronCount: number;
  synapseCount: number;
  clusterCount: number;
  fps: number;
  latestMessage?: ChatMessage;
  mode: 'IDLE' | 'THINKING' | 'SLEEPING' | 'FROZEN';
  zoomLevel: number;
}

export interface ViewportTransform {
  x: number;
  y: number;
  scale: number;
}

export interface SerializedBrain {
  timestamp: number;
  neurons: Neuron[];
  clusters: Cluster[];
}
