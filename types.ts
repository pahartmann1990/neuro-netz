
export enum Neurotransmitter {
  Dopamine = 'DOPAMINE',
  Serotonin = 'SEROTONIN',
  Adrenaline = 'ADRENALINE'
}

export type RegionId = string; // e.g., "INPUT", "SCIENCE", "BIOLOGY"

export interface Cluster {
  id: RegionId;
  label: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  targetCount: number; // Target number of neurons in this cluster
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
  regionId: RegionId; // Belongs to which cluster?
  x: number;
  y: number;
  label?: string; // Concept label (e.g. "Hello")
  character?: string; // For Input Grid (e.g. "A")
  isCompressed?: boolean; // If true, this represents a compressed symbol (binary/hex optimization)
  
  potential: number; 
  threshold: number; 
  refractoryPeriod: number; 
  lastFired: number;
  
  age: number; 
  stress: number; 
  energy: number; 

  neurotransmitters: {
    [Neurotransmitter.Dopamine]: number;
    [Neurotransmitter.Serotonin]: number;
    [Neurotransmitter.Adrenaline]: number;
  };

  connections: Synapse[];
}

export interface ChatMessage {
  sender: 'USER' | 'SYSTEM' | 'SELF';
  text: string;
  timestamp: number;
}

export interface BrainStats {
  neuronCount: number;
  synapseCount: number;
  clusterCount: number;
  fps: number;
  latestMessage?: ChatMessage;
  mode: 'IDLE' | 'THINKING' | 'FROZEN';
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
