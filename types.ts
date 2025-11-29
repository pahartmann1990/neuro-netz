
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
  isDynamic?: boolean;
  layerIndex?: number; // For Deep Learning Architecture (0-4)
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
  id: string;
  sessionId: number; // Multi-Chat Support
  sender: 'USER' | 'SYSTEM' | 'SELF' | 'TEACHER';
  text: string;
  timestamp: number;
  isCorrection?: boolean;
}

export interface TeacherState {
    status: 'IDLE' | 'ANALYZING' | 'TEACHING' | 'WAITING' | 'CORRECTING' | 'PRAISING';
    currentFocus: string;
    patience: number;
    lastAction: string;
    thoughtProcess: string; // What the Teacher AI is thinking internally
}

export interface DiagnosticReport {
    networkHealth: number; // 0-100
    deadNeurons: number;
    weakConnections: number;
    dominantTopic: string;
    errorCode?: string; // e.g., "NO_OUTPUT_SIGNAL"
}

export interface BrainStats {
  neuronCount: number;
  synapseCount: number;
  clusterCount: number;
  fps: number;
  latestMessage?: ChatMessage;
  mode: 'IDLE' | 'THINKING' | 'SLEEPING' | 'FROZEN' | 'READING' | 'TRAINING';
  zoomLevel: number;
  queueLength: number;
  isLearningMode: boolean; // TRUE = Trust Mode (Facts)
  currentLesson?: string;
  trainingTopic?: string;
  studentResponse?: string;
  
  // New Teacher Stats
  teacherState?: TeacherState;
  diagnostics?: DiagnosticReport;
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

export interface AiLesson {
    id: string;
    topic: string;
    prompts: { question: string, answer: string }[];
}
