import { Neurotransmitter, RegionType } from "./types";

export const COLORS = {
  [Neurotransmitter.Dopamine]: '#10B981', // Emerald Green
  [Neurotransmitter.Serotonin]: '#3B82F6', // Blue
  [Neurotransmitter.Adrenaline]: '#EF4444', // Red
  NEURON_BASE: '#4B5563', // Gray
  NEURON_ACTIVE: '#F59E0B', // Amber/White hot
  BACKGROUND: '#0f172a', // Slate 900
  
  // Region Colors (Background hints)
  REGION_SENSORY: 'rgba(236, 72, 153, 0.1)', // Pinkish
  REGION_ASSOCIATION: 'rgba(99, 102, 241, 0.1)', // Indigoish
  REGION_MOTOR: 'rgba(34, 197, 94, 0.1)' // Greenish
};

export const PHYSICS = {
  INITIAL_NEURONS: 15, // Start very small
  MAX_NEURONS: 150, // Hard limit for browser performance
  CONNECTION_RADIUS: 120,
  BASE_DECAY: 0.92, 
  FIRE_THRESHOLD_BASE: 0.8,
  LEARNING_RATE_BASE: 0.08,
  
  // Biological Limits
  GROWTH_THRESHOLD: 0.9, // Stress level required to spawn new neuron
  PRUNE_THRESHOLD: 10000, // Ms of inactivity before death
};

// Layout configurations for regions (relative 0-1)
export const REGION_LAYOUT = {
  [RegionType.SensoryInput]: { x: 0.2, y: 0.5, label: "Sprach-Cortex (Input)" },
  [RegionType.Association]: { x: 0.5, y: 0.5, label: "Assoziation (Denken)" },
  [RegionType.MotorOutput]: { x: 0.8, y: 0.5, label: "Ergebnis (Output)" },
};