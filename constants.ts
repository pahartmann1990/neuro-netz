
import { Neurotransmitter, AiLesson } from "./types";

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
  
  // Deep Layers
  LAYER_1: '#a78bfa',
  LAYER_2: '#818cf8',
  LAYER_3: '#34d399',
  LAYER_4: '#facc15',

  BACKGROUND: '#020617', 
  
  // Cluster Backgrounds
  CLUSTER_SENSORY: 'rgba(236, 72, 153, 0.05)', 
  CLUSTER_GERMAN: 'rgba(245, 158, 11, 0.05)',
  CLUSTER_ENGLISH: 'rgba(59, 130, 246, 0.05)',
  CLUSTER_MEMORY: 'rgba(139, 92, 246, 0.05)',
};

export const PHYSICS = {
  // Strict Layout Coordinates (Deep Learning Pipeline)
  ZONE_SENSORY_X: -600, 
  ZONE_LANGUAGE_X: -200,
  
  // Deep Layers
  LAYER_1_X: 200,  // Encoding
  LAYER_2_X: 500,  // Hidden
  LAYER_3_X: 800,  // Abstract
  LAYER_4_X: 1100, // Output
  
  ZONE_WIDTH: 250,
  
  CONNECTION_RADIUS: 400, 
  
  // Firing Logic
  FIRE_THRESHOLD_BASE: 20, 
  FIRE_THRESHOLD_PUNCTUATION: 70, 
  
  RECOVERY_RATE: 0.15, 
  SYNAPSE_DECAY: 0.995, 
};

// Key Mapping for the Alphabet Grid
export const ALPHABET_GRID = [
  ['1','2','3','4','5','6','7','8','9','0'],
  ['Q','W','E','R','T','Z','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Y','X','C','V','B','N','M'],
  ['{','}','[',']','(',')','<','>','/','*','+','='] 
];

export const NEGATIVE_FEEDBACK_WORDS = ['FALSCH', 'NEIN', 'WRONG', 'BAD', 'FEHLER', 'STOP', 'DAS IST FALSCH', 'NICHT GUT'];
export const POSITIVE_FEEDBACK_WORDS = ['GUT', 'RICHTIG', 'CORRECT', 'GOOD', 'SUPER', 'JA', 'STIMMT', 'GENAU'];

// --- THE TEACHER'S BRAIN (SEMANTIC DB) ---
// This simulates what a real LLM would return. 
// Later, this will be replaced by real API calls.
export const SEMANTIC_DB: Record<string, { def: string, traits: string[], related: string[] }> = {
    "HUND": {
        def: "Ein Hund ist ein Haustier.",
        traits: ["BELLT", "HAT FELL", "SPIELT", "IST TREU", "HAT VIER BEINE"],
        related: ["TIER", "KATZE", "FUTTER", "LEINE"]
    },
    "KATZE": {
        def: "Eine Katze ist ein eigenwilliges Tier.",
        traits: ["MIAUT", "SCHLÄFT", "JAGT MÄUSE", "HAT SCHNURRHAARE"],
        related: ["TIER", "HUND", "MILCH", "KRATZBAUM"]
    },
    "AUTO": {
        def: "Ein Auto ist ein Fahrzeug.",
        traits: ["FÄHRT SCHNELL", "HAT RÄDER", "BRAUCHT BENZIN", "MACHT LÄRM"],
        related: ["STRASSE", "AMPEL", "MOTOR", "FAHREN"]
    },
    "KI": {
        def: "KI ist künstliche Intelligenz.",
        traits: ["LERNEN", "DENKEN", "RECHNEN", "SIMULIEREN"],
        related: ["COMPUTER", "NETZWERK", "ZUKUNFT", "ROBOTER"]
    },
    "ICH": {
        def: "Das Ich ist das Selbstbewusstsein.",
        traits: ["BIN HIER", "DENKE", "FÜHLE", "EXISTIERE"],
        related: ["DU", "WIR", "BEWUSSTSEIN"]
    },
    "PROGRAMMIEREN": {
        def: "Programmieren ist das Schreiben von Code.",
        traits: ["LOGIK", "SYNTAX", "FEHLER", "KOMPILIEREN"],
        related: ["COMPUTER", "SOFTWARE", "ENTWICKLER"]
    }
};

export const COMMON_WORDS_DE = ['DER', 'DIE', 'DAS', 'UND', 'IST', 'ICH', 'DU', 'NICHT', 'EIN', 'EINE', 'MIT', 'DEN', 'IM', 'ZU', 'VON', 'HABE', 'SIND', 'ES', 'WIE', 'WAS', 'WO', 'ABER', 'ODER'];
export const COMMON_WORDS_EN = ['THE', 'IS', 'AND', 'I', 'YOU', 'NOT', 'A', 'AN', 'WITH', 'TO', 'OF', 'HAVE', 'ARE', 'FOR', 'THIS', 'THAT', 'WHAT', 'HOW', 'BUT', 'OR', 'IF', 'THEN', 'ELSE', 'VAR', 'LET', 'CONST', 'FUNCTION', 'RETURN'];
