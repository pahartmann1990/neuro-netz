
import { Neurotransmitter } from "./types";

export const COLORS = {
  [Neurotransmitter.Dopamine]: '#10B981', 
  [Neurotransmitter.Serotonin]: '#3B82F6', 
  [Neurotransmitter.Adrenaline]: '#EF4444', 
  NEURON_BASE: '#64748b', 
  NEURON_ACTIVE: '#fbbf24', 
  NEURON_COMPRESSED: '#ec4899', // Pink/Magenta for compressed high-efficiency nodes
  BACKGROUND: '#020617', 
  SHORTCUT: '#22d3ee',
  
  // Specific Cluster Colors
  CLUSTER_INPUT: 'rgba(236, 72, 153, 0.15)', 
  CLUSTER_DEFAULT: 'rgba(99, 102, 241, 0.15)',
  
  // Dynamic colors for new regions
  DYNAMIC_REGIONS: [
    'rgba(34, 197, 94, 0.2)', // Green
    'rgba(234, 179, 8, 0.2)', // Yellow
    'rgba(249, 115, 22, 0.2)', // Orange
    'rgba(168, 85, 247, 0.2)', // Purple
    'rgba(236, 72, 153, 0.2)', // Pink
  ]
};

export const PHYSICS = {
  INITIAL_NEURONS: 0, 
  MAX_NEURONS: 5000, 
  CONNECTION_RADIUS: 180, 
  
  FIRE_THRESHOLD_BASE: 25, // Increased slightly to reduce noise
  RECOVERY_RATE: 0.1, 
  SYNAPSE_DECAY: 0.995, 
};

// Key Mapping for the Alphabet Grid (Visual Layout)
export const ALPHABET_GRID = [
  ['1','2','3','4','5','6','7','8','9','0'],
  ['Q','W','E','R','T','Z','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Y','X','C','V','B','N','M']
];

export const VOCABULARY = [];
