import { Neurotransmitter, RegionType } from "./types";

export const COLORS = {
  [Neurotransmitter.Dopamine]: '#10B981', 
  [Neurotransmitter.Serotonin]: '#3B82F6', 
  [Neurotransmitter.Adrenaline]: '#EF4444', 
  NEURON_BASE: '#4B5563', 
  NEURON_ACTIVE: '#F59E0B', 
  BACKGROUND: '#000000', 
  
  REGION_SENSORY: 'rgba(236, 72, 153, 0.2)', 
  REGION_VISUAL: 'rgba(234, 179, 8, 0.2)',
  REGION_ASSOCIATION: 'rgba(99, 102, 241, 0.2)', 
  REGION_MOTOR: 'rgba(34, 197, 94, 0.2)' 
};

export const PHYSICS = {
  INITIAL_NEURONS: 50, 
  MAX_NEURONS: 2000, // Increased limit due to Canvas performance
  CONNECTION_RADIUS: 150,
  
  // Physics
  FIRE_THRESHOLD_BASE: 15,
  RECOVERY_RATE: 0.1, // How fast energy recovers
  
  // No more time-based decay for skills. 
  // Decay only happens on unused synaptic paths during reorganization.
  SYNAPSE_DECAY: 0.9999, 
};

// Layout configurations (relative 0-1)
export const REGION_LAYOUT = {
  [RegionType.SensoryInput]: { x: 0.15, y: 0.3, label: "Audio/Text (Sprache)" },
  [RegionType.VisualInput]: { x: 0.15, y: 0.7, label: "Visueller Cortex (Bild)" },
  [RegionType.Association]: { x: 0.5, y: 0.5, label: "Verarbeitung (Logik)" },
  [RegionType.MotorOutput]: { x: 0.85, y: 0.5, label: "Output (Handlung)" },
};