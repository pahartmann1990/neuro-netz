
import { Neurotransmitter } from "./types";

export const COLORS = {
  [Neurotransmitter.Dopamine]: '#10B981', // Green (Good)
  [Neurotransmitter.Serotonin]: '#3B82F6', // Blue (Stable)
  [Neurotransmitter.Adrenaline]: '#F59E0B', // Orange (Active)
  [Neurotransmitter.Cortisol]: '#EF4444', // Red (Bad/Punish)
  
  NEURON_BASE: '#64748b', 
  NEURON_ACTIVE: '#fbbf24', 
  
  // Specialized Node Colors
  NODE_SENSORY: '#ec4899',    // Pink (Input)
  NODE_VISUAL: '#06b6d4',     // Cyan (Visual Input)
  NODE_GERMAN: '#f59e0b',     // Amber (German)
  NODE_ENGLISH: '#3b82f6',    // Blue (English)
  NODE_MEMORY: '#8b5cf6',     // Violet (Core Concepts)
  NODE_SYMBOL: '#10b981',     // Emerald (Compressed/Optimized)
  NODE_PUNCTUATION: '#f43f5e', // Red/Pink for Punctuation
  
  BACKGROUND: '#020617', 
  
  // Cluster Backgrounds
  CLUSTER_SENSORY: 'rgba(236, 72, 153, 0.05)', 
  CLUSTER_GERMAN: 'rgba(245, 158, 11, 0.05)',
  CLUSTER_ENGLISH: 'rgba(59, 130, 246, 0.05)',
  CLUSTER_MEMORY: 'rgba(139, 92, 246, 0.05)',
};

export const PHYSICS = {
  // Strict Layout Coordinates
  ZONE_SENSORY_X: -400,
  ZONE_LANGUAGE_X: 0,
  ZONE_MEMORY_X: 500,
  
  ZONE_WIDTH: 300,
  
  CONNECTION_RADIUS: 400, 
  
  // Firing Logic
  FIRE_THRESHOLD_BASE: 20, 
  FIRE_THRESHOLD_PUNCTUATION: 65, 
  
  RECOVERY_RATE: 0.1, 
  SYNAPSE_DECAY: 0.995, 
};

// Key Mapping for the Alphabet Grid
export const ALPHABET_GRID = [
  ['1','2','3','4','5','6','7','8','9','0'],
  ['Q','W','E','R','T','Z','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Y','X','C','V','B','N','M']
];

export const COMMON_WORDS_DE = ['DER', 'DIE', 'DAS', 'UND', 'IST', 'ICH', 'DU', 'NICHT', 'EIN', 'EINE', 'MIT', 'DEN', 'IM', 'ZU', 'VON', 'HABE', 'SIND', 'ES', 'WIE', 'WAS', 'WO'];
export const COMMON_WORDS_EN = ['THE', 'IS', 'AND', 'I', 'YOU', 'NOT', 'A', 'AN', 'WITH', 'TO', 'OF', 'HAVE', 'ARE', 'FOR', 'THIS', 'THAT', 'WHAT', 'HOW'];
