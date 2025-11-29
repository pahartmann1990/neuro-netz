
import { Neuron, Neurotransmitter, Synapse, BrainStats, ChatMessage, Cluster, SerializedBrain, AiLesson, TeacherState, DiagnosticReport, SystemConfig } from "../types";
import { PHYSICS, COLORS, ALPHABET_GRID, COMMON_WORDS_DE, COMMON_WORDS_EN, NEGATIVE_FEEDBACK_WORDS, POSITIVE_FEEDBACK_WORDS, SEMANTIC_DB } from "../constants";

const generateId = () => Math.random().toString(36).substr(2, 9);

export class BioEngine {
  neurons: Neuron[] = [];
  clusters: Cluster[] = [];
  width: number;
  height: number;
  
  isThinking: boolean = false;
  isFrozen: boolean = false;
  isSleeping: boolean = false;
  isLearningMode: boolean = false; 
  
  // --- SYSTEM CONFIG ---
  config: SystemConfig = {
      n8nWebhookUrl: "",
      localLlmUrl: "http://localhost:11434/api/generate",
      useRealAi: false,
      autoPrune: true
  };

  // --- SMART TEACHER STATE ---
  isTraining: boolean = false;
  trainingTopic: string = "Grundlagen";
  teacherState: TeacherState = {
      status: 'IDLE',
      currentFocus: '',
      patience: 100,
      lastAction: 'Bereit',
      thoughtProcess: 'Warte auf Anweisungen...'
  };
  
  // Teacher internal tracking
  currentLessonQueue: string[] = [];
  waitingForWord: string | null = null;
  studentSilenceCounter: number = 0;

  lastTick: number = 0;
  frameCount: number = 0;
  currentZoom: number = 0.6; 

  outputBuffer: string[] = [];
  
  lastInputNeurons: Neuron[] = []; 
  lastInputNeuron: Neuron | null = null;
  activeConceptNeurons: Neuron[] = []; 
  
  inputQueue: string[] = [];
  readingSpeed: number = 4; 
  readingTickCounter: number = 0;

  pendingSystemMessages: ChatMessage[] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.initializeNetwork();
    
    setInterval(() => {
        this.discoverNewTopics();
        if (this.config.autoPrune) this.pruneNetwork();
    }, 10000);
  }

  initializeNetwork() {
    this.neurons = [];
    this.setupClusters();

    // Build Keyboard
    const startX = PHYSICS.ZONE_SENSORY_X - 120;
    const startY = -250;
    const gap = 30;

    ALPHABET_GRID.forEach((row, rIdx) => {
      row.forEach((char, cIdx) => {
        this.createNeuron({
          id: `KEY_${char}`,
          regionId: 'SENSORY',
          x: startX + cIdx * gap + (rIdx * 10),
          y: startY + rIdx * gap,
          character: char,
          threshold: 15,
        });
      });
    });
  }

  setupClusters() {
    this.clusters = [
      { id: 'SENSORY', label: 'SENSORY (INPUT)', x: PHYSICS.ZONE_SENSORY_X, y: 0, radius: 200, color: COLORS.CLUSTER_SENSORY, targetCount: 140, layerIndex: 0 },
      { id: 'LANG', label: 'LANGUAGE CENTER', x: PHYSICS.ZONE_LANGUAGE_X, y: 0, radius: 250, color: COLORS.CLUSTER_ENGLISH, targetCount: 0, layerIndex: 0.5 },
      { id: 'LAYER_1', label: 'LAYER 1: ENCODE', x: PHYSICS.LAYER_1_X, y: 0, radius: 120, color: COLORS.LAYER_1 + '22', targetCount: 0, layerIndex: 1 },
      { id: 'LAYER_2', label: 'LAYER 2: HIDDEN', x: PHYSICS.LAYER_2_X, y: 0, radius: 120, color: COLORS.LAYER_2 + '22', targetCount: 0, layerIndex: 2 },
      { id: 'LAYER_3', label: 'LAYER 3: ABSTRACT', x: PHYSICS.LAYER_3_X, y: 0, radius: 120, color: COLORS.LAYER_3 + '22', targetCount: 0, layerIndex: 3 },
      { id: 'LAYER_4', label: 'LAYER 4: OUTPUT', x: PHYSICS.LAYER_4_X, y: 0, radius: 120, color: COLORS.LAYER_4 + '22', targetCount: 0, layerIndex: 4 },
    ];
  }

  createNeuron(partial: Partial<Neuron>): Neuron {
    const n: Neuron = {
      id: partial.id || generateId(),
      regionId: partial.regionId || 'LAYER_1',
      x: partial.x || 0,
      y: partial.y || 0,
      character: partial.character,
      label: partial.label,
      pixelIndex: partial.pixelIndex,
      isCompressed: partial.isCompressed || false,
      potential: 0,
      threshold: partial.threshold || PHYSICS.FIRE_THRESHOLD_BASE,
      refractoryPeriod: 0,
      lastFired: 0,
      age: 0,
      stress: 0,
      energy: 1.0,
      neurotransmitters: {},
      connections: []
    };
    this.neurons.push(n);
    return n;
  }

  // --- REAL AI INTEGRATION ---
  
  async callLocalLLM(prompt: string): Promise<string> {
      if (!this.config.localLlmUrl) return "Error: No Local LLM URL configured.";
      
      try {
          // Standard Ollama/LocalAI format
          const response = await fetch(this.config.localLlmUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  model: "llama3", // Default, can be changed by user later
                  prompt: `Du bist ein Lehrer für ein neuronales Netz. Antworte kurz. Thema: ${prompt}`,
                  stream: false
              })
          });
          
          if (!response.ok) throw new Error("Local AI Offline");
          const data = await response.json();
          return data.response || "Keine Antwort vom LLM.";
      } catch (e) {
          console.error(e);
          return "FEHLER: Konnte lokale AI nicht erreichen (CORS oder Offline). Nutze Simulation.";
      }
  }

  async sendToN8N(text: string) {
      if (!this.config.n8nWebhookUrl) return;
      
      try {
          // Fire and forget - don't block the brain
          fetch(this.config.n8nWebhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  source: "BioNet_V16",
                  timestamp: Date.now(),
                  output: text
              })
          }).catch(e => console.warn("N8N Send Failed", e));
      } catch (e) {
          // Ignore errors to keep simulation running
      }
  }

  // --- TEACHER ENGINE ---

  askExternalAI(prompt: string): { intent: string, topic?: string, curriculum?: string[] } {
      const upper = prompt.toUpperCase();
      
      // 1. Parse Intent
      let topic = "";
      // Simple heuristic mapping
      if (upper.includes("HUND")) topic = "HUND";
      else if (upper.includes("KATZE")) topic = "KATZE";
      else if (upper.includes("AUTO")) topic = "AUTO";
      else if (upper.includes("KI")) topic = "KI";
      else if (upper.includes("ICH")) topic = "ICH";
      else if (upper.includes("PROGRAMMIEREN")) topic = "PROGRAMMIEREN";
      else {
          const words = upper.split(' ');
          topic = words[words.length - 1].replace(/[^A-Z]/g, ''); 
      }

      const dbEntry = SEMANTIC_DB[topic];
      
      if (dbEntry) {
          const steps = [];
          steps.push(`${topic}`);
          steps.push(`${dbEntry.def}`);
          dbEntry.traits.forEach(t => steps.push(`${topic} ${t}`));
          return { intent: 'TEACH', topic, curriculum: steps };
      }
      
      if (upper.includes("FALSCH") || upper.includes("NICHT") || upper.includes("STOP")) {
          return { intent: 'CORRECT' };
      }

      return { intent: 'TEACH', topic, curriculum: [topic, `${topic} ist ein Ding.`] };
  }

  async processTeacherCommand(userText: string) {
      this.teacherState.thoughtProcess = `Analysiere Anweisung: "${userText}"...`;
      
      if (this.config.useRealAi) {
          // --- REAL AI BRANCH ---
          this.teacherState.thoughtProcess = `Frage externe KI (LocalHost)...`;
          try {
              const llmResponse = await this.callLocalLLM(userText);
              this.teacherState.thoughtProcess = `KI Antwort erhalten. Erstelle Lehrplan...`;
              
              // Parse LLM response into simple sentences for the bio-net
              const simpleSentences = llmResponse.split(/[.!?]/).filter(s => s.length > 2);
              this.startAiTraining("EXTERNES_WISSEN", simpleSentences);
              
          } catch (e) {
              this.teacherState.thoughtProcess = `KI Fehler. Falle zurück auf interne DB.`;
              this.processInternalLogic(userText);
          }
      } else {
          // --- INTERNAL SIMULATION BRANCH ---
          this.processInternalLogic(userText);
      }
  }

  processInternalLogic(userText: string) {
      // Simulate thinking delay
      setTimeout(() => {
          const aiResponse = this.askExternalAI(userText);
          
          if (aiResponse.intent === 'TEACH' && aiResponse.curriculum) {
              this.teacherState.thoughtProcess = `Thema erkannt: ${aiResponse.topic}. Generiere Lehrplan aus DB...`;
              this.startAiTraining(aiResponse.topic || "Unbekannt", aiResponse.curriculum);
          } else if (aiResponse.intent === 'CORRECT') {
               this.teacherState.thoughtProcess = `Kritik erkannt. Leite Cortisol-Ausschüttung ein.`;
               this.applyReinforcement('PUNISH');
               this.pendingSystemMessages.push({
                   id: generateId(), sessionId: 0, sender: 'TEACHER', 
                   text: "Korrektur angewendet.", timestamp: Date.now() 
               });
          } else {
               this.teacherState.thoughtProcess = `Unklare Anweisung.`;
               this.pendingSystemMessages.push({
                   id: generateId(), sessionId: 0, sender: 'TEACHER', 
                   text: `Ich kenne "${userText}" nicht. Definiere es genauer.`, timestamp: Date.now() 
               });
          }
      }, 500);
  }

  startAiTraining(topic: string, curriculum: string[]) {
      this.isTraining = true;
      this.trainingTopic = topic;
      this.studentSilenceCounter = 0;
      this.currentLessonQueue = curriculum;
      
      this.teacherState = {
          status: 'TEACHING',
          currentFocus: topic,
          patience: 100,
          lastAction: 'Starte Lektion',
          thoughtProcess: `Lade ${curriculum.length} Fakten über ${topic}...`
      };
      
      this.pendingSystemMessages.push({
          id: generateId(), sessionId: 0, sender: 'TEACHER', 
          text: `Lehrplan "${topic}" gestartet.`, 
          timestamp: Date.now()
      });
  }

  stopAiTraining() {
      this.isTraining = false;
      this.teacherState.status = 'IDLE';
      this.teacherState.thoughtProcess = 'Warte auf Input...';
  }

  runSmartTeacherLoop() {
      if (!this.isTraining || this.isFrozen) return;

      if (Math.random() > 0.03) return; 

      switch (this.teacherState.status) {
          case 'TEACHING':
              if (this.currentLessonQueue.length > 0) {
                  const lesson = this.currentLessonQueue[0];
                  const targetWord = this.extractKeyConcept(lesson);
                  this.waitingForWord = targetWord;
                  
                  this.teacherState.thoughtProcess = `Injiziere: "${lesson}"`;
                  
                  this.pendingSystemMessages.push({
                      id: generateId(), sessionId: 0, sender: 'TEACHER', 
                      text: `Lektion: "${lesson}"`, 
                      timestamp: Date.now()
                  });
                  
                  const wasLearning = this.isLearningMode;
                  this.isLearningMode = true; 
                  this.processInput(lesson);
                  this.isLearningMode = wasLearning;

                  this.teacherState.status = 'WAITING';
                  this.studentSilenceCounter = 0;
              } else {
                  this.teacherState.thoughtProcess = `Lehrplan beendet.`;
                  this.pendingSystemMessages.push({
                      id: generateId(), sessionId: 0, sender: 'TEACHER', 
                      text: `Training abgeschlossen.`, 
                      timestamp: Date.now()
                  });
                  this.stopAiTraining();
              }
              break;

          case 'WAITING':
              this.studentSilenceCounter++;
              if (this.studentSilenceCounter > 80) { 
                  this.teacherState.status = 'CORRECTING';
              }
              break;
              
          case 'CORRECTING':
              this.teacherState.thoughtProcess = `Keine Reaktion auf "${this.waitingForWord}". Eingriff.`;
              const problemNeuron = this.neurons.find(n => n.label?.toUpperCase() === this.waitingForWord?.toUpperCase());
              
              if (!problemNeuron) {
                  this.processInput(this.waitingForWord || "");
                  this.teacherState.status = 'WAITING';
                  this.studentSilenceCounter = 0;
              } else {
                  problemNeuron.potential += 60; 
                  this.teacherState.status = 'WAITING';
                  this.studentSilenceCounter = 0;
              }
              break;
      }
  }

  extractKeyConcept(sentence: string): string {
      const words = sentence.split(' ');
      return words.reduce((a, b) => a.length > b.length ? a : b).toUpperCase();
  }

  runDiagnostics(): DiagnosticReport {
      const deadNeurons = this.neurons.filter(n => n.connections.length === 0 && n.regionId !== 'SENSORY').length;
      const weakConnections = this.neurons.reduce((acc, n) => acc + n.connections.filter(c => c.weight < 2).length, 0);
      return {
          networkHealth: Math.max(0, 100 - (deadNeurons * 2)),
          deadNeurons,
          weakConnections,
          dominantTopic: this.trainingTopic,
          errorCode: this.studentSilenceCounter > 80 ? "NO_RESPONSE_SIGNAL" : undefined
      };
  }

  getLayerIndex(regionId: string): number {
      if (regionId === 'SENSORY') return 0;
      if (regionId.startsWith('LANG')) return 0.5;
      if (regionId === 'LAYER_1') return 1;
      if (regionId === 'LAYER_2') return 2;
      if (regionId === 'LAYER_3') return 3;
      if (regionId === 'LAYER_4') return 4;
      return 1; 
  }

  checkConnectionValidity(source: Neuron, target: Neuron): boolean {
    if (source.id === target.id) return false;
    const l1 = this.getLayerIndex(source.regionId);
    const l2 = this.getLayerIndex(target.regionId);
    if (this.isLearningMode) {
        return l2 >= l1; 
    }
    return true;
  }

  determineRegionForWord(word: string): string {
    const upper = word.toUpperCase();
    if (COMMON_WORDS_DE.includes(upper)) return 'LANG';
    if (COMMON_WORDS_EN.includes(upper)) return 'LANG';
    if (word.length > 7) return 'LAYER_3'; 
    if (word.length > 4) return 'LAYER_2';
    return 'LAYER_1';
  }

  discoverNewTopics() {
      // Placeholder: Analyze network activity to find emerging topics
  }

  pruneNetwork() {
      if (this.isFrozen) return;
      this.neurons.forEach(n => {
          n.connections = n.connections.filter(c => c.weight > 0.5);
      });
      this.neurons = this.neurons.filter(n => {
          if (n.regionId === 'SENSORY') return true;
          const hasLinks = n.connections.length > 0 || this.neurons.some(o => o.connections.some(c => c.targetId === n.id));
          return hasLinks;
      });
  }

  applyReinforcement(type: 'REWARD' | 'PUNISH') {
      const now = Date.now();
      const window = 15000;
      this.neurons.forEach(n => {
          if (now - n.lastFired < window && n.regionId !== 'SENSORY') {
              if (type === 'REWARD') {
                  n.potential += 50;
                  n.connections.forEach(c => { if(now-c.lastActive<window) c.weight += 3; });
              } else {
                  n.potential = -100;
                  n.connections = n.connections.filter(c => {
                      if (now - c.lastActive < window) {
                          c.weight -= 10; 
                          return c.weight > 0;
                      }
                      return true;
                  });
              }
          }
      });
  }

  processInput(text: string) {
    const upperText = text.toUpperCase().trim();
    
    const isNegative = NEGATIVE_FEEDBACK_WORDS.some(w => upperText === w || upperText.startsWith(w + ' '));
    const isPositive = POSITIVE_FEEDBACK_WORDS.some(w => upperText === w || upperText.startsWith(w + ' '));

    if (isNegative) {
        this.applyReinforcement('PUNISH');
        this.pendingSystemMessages.push({
            id: generateId(), sessionId: 0, sender: 'SYSTEM', text: 'Verstanden. Korrektur angewendet.', timestamp: Date.now(), isCorrection: true
        });
        return; 
    }

    if (isPositive) {
        this.applyReinforcement('REWARD');
        return;
    }

    const tokens = text.match(/[\p{L}\p{N}_]+|[.,!?;:{}\[\]<>/\\*+=]/gu);
    if (tokens) {
      this.lastInputNeuron = null; 
      tokens.forEach(token => this.processInputToken(token));
      
      if (!this.isLearningMode && !this.isTraining) {
           setTimeout(() => this.generateResponse(), 500);
      }
      if (this.isTraining) {
          setTimeout(() => this.generateResponse(), 500);
      }
    }
  }

  processInputToken(token: string) {
    if (this.isFrozen) return;
    
    const upper = token.toUpperCase();
    for (let i = 0; i < upper.length; i++) {
      const char = upper[i];
      const neuron = this.neurons.find(n => n.character === char);
      if (neuron) {
        neuron.potential += 35;
        neuron.lastFired = Date.now();
      }
    }

    let neuron = this.neurons.find(n => n.label === token);
    const isPunctuation = /[.,!?;:]/.test(token);
    
    if (!neuron) {
        const targetRegion = isPunctuation ? 'LAYER_4' : this.determineRegionForWord(token);
        let zoneX = PHYSICS.LAYER_1_X;
        if (targetRegion === 'LANG') zoneX = PHYSICS.ZONE_LANGUAGE_X;
        if (targetRegion === 'LAYER_1') zoneX = PHYSICS.LAYER_1_X;
        if (targetRegion === 'LAYER_2') zoneX = PHYSICS.LAYER_2_X;
        if (targetRegion === 'LAYER_3') zoneX = PHYSICS.LAYER_3_X;
        if (targetRegion === 'LAYER_4') zoneX = PHYSICS.LAYER_4_X;

        neuron = this.createNeuron({
            label: token,
            regionId: targetRegion,
            x: zoneX + (Math.random()-0.5) * 100,
            y: (Math.random()-0.5) * 800,
            threshold: isPunctuation ? 80 : 20
        });
    } else {
        neuron.potential += 40;
    }

    this.activeConceptNeurons.push(neuron);
    if (this.activeConceptNeurons.length > 8) this.activeConceptNeurons.shift();

    if (this.isLearningMode && this.lastInputNeuron) {
        this.strengthenConnection(this.lastInputNeuron, neuron, 5.0);
    } else if (this.lastInputNeuron) {
         this.strengthenConnection(this.lastInputNeuron, neuron, 0.5);
    }

    this.lastInputNeuron = neuron;
  }

  strengthenConnection(source: Neuron, target: Neuron, amount: number) {
      if (!this.checkConnectionValidity(source, target)) return;
      let connection = source.connections.find(c => c.targetId === target.id);
      if (!connection) {
          source.connections.push({
              targetId: target.id,
              weight: amount,
              plasticity: 0.5,
              lastActive: Date.now()
          });
      } else {
          connection.weight += amount;
          connection.lastActive = Date.now();
      }
  }

  generateResponse() {
      if (this.activeConceptNeurons.length === 0) return;
      let currentNeuron = this.activeConceptNeurons[this.activeConceptNeurons.length - 1];
      const sentence: string[] = [];
      const visited = new Set<string>();

      for(let i=0; i<15; i++) {
          const candidates = currentNeuron.connections
              .map(c => ({ id: c.targetId, weight: c.weight, neuron: this.neurons.find(n => n.id === c.targetId) }))
              .filter(item => item.neuron && !visited.has(item.neuron.label || ''))
              .sort((a, b) => b.weight - a.weight);

          if (candidates.length === 0) break;
          const next = candidates[0].neuron!;
          
          if (next.label) {
              sentence.push(next.label);
              visited.add(next.label);
              next.potential += 30; 
              currentNeuron = next;
              if (/[.!?]/.test(next.label)) break;
          }
      }

      if (sentence.length > 0) {
          const fullSentence = sentence.join(' ');
          this.outputBuffer.push(...sentence);
          
          // SEND TO N8N if configured
          if (this.config.n8nWebhookUrl) {
              this.sendToN8N(fullSentence);
          }
      }
  }

  queueText(fullText: string) {
      const sentences = fullText.replace(/([.?!])\s*(?=[A-Z])/g, "$1|").replace(/\n/g, "|").split("|");
      sentences.forEach(s => {
          const clean = s.trim();
          if (clean.length > 0) {
              const tokens = clean.match(/[\p{L}\p{N}_]+|[.,!?;:{}\[\]<>/\\*+=]/gu);
              if (tokens) {
                  this.inputQueue.push(...tokens);
                  this.inputQueue.push("_PAUSE_"); 
              }
          }
      });
  }

  tick(): BrainStats {
    this.runSmartTeacherLoop();

    if (this.isFrozen) return { neuronCount: this.neurons.length, synapseCount: 0, clusterCount: this.clusters.length, fps: 0, mode: 'FROZEN', zoomLevel: 1, queueLength: 0, isLearningMode: false };

    const now = Date.now();
    this.frameCount++;

    if (this.inputQueue.length > 0) {
        this.readingTickCounter++;
        if (this.readingTickCounter > this.readingSpeed) {
            const token = this.inputQueue.shift();
            if (token) {
                if (token === "_PAUSE_") this.lastInputNeuron = null;
                else this.processInputToken(token);
            }
            this.readingTickCounter = 0;
        }
    }

    let newMessage: ChatMessage | undefined;
    if (this.pendingSystemMessages.length > 0) newMessage = this.pendingSystemMessages.shift();

    for (const n of this.neurons) {
      n.potential *= 0.95;
      if (n.refractoryPeriod > 0) n.refractoryPeriod--;
      if (n.potential > n.threshold && n.refractoryPeriod <= 0) {
        n.lastFired = now;
        n.potential = -20; 
        n.refractoryPeriod = 5; 
        for (const syn of n.connections) {
          const target = this.neurons.find(t => t.id === syn.targetId);
          if (target) {
            target.potential += syn.weight;
            syn.lastActive = now;
          }
        }
      }
    }

    if (this.outputBuffer.length > 0) {
        const text = this.outputBuffer.join(' ').replace(/\s+([.,!?:;])/g, '$1');
        
        if (this.isTraining && this.waitingForWord && this.teacherState.status === 'WAITING') {
            const cleanOutput = text.toUpperCase();
            if (cleanOutput.includes(this.waitingForWord.toUpperCase())) {
                this.applyReinforcement('REWARD');
                this.pendingSystemMessages.push({
                    id: generateId(), sessionId: 0, sender: 'TEACHER', 
                    text: `Korrekt! "${text}" erkannt.`, timestamp: Date.now()
                });
                this.teacherState.status = 'TEACHING'; 
                this.currentLessonQueue.shift();
            }
        }

        if (this.isTraining || text.length > 2) {
             newMessage = { id: generateId(), sessionId: -1, sender: 'SELF', text, timestamp: now };
        }
        
        this.outputBuffer = [];
    }

    return {
      neuronCount: this.neurons.length,
      synapseCount: this.neurons.reduce((a, b) => a + b.connections.length, 0),
      clusterCount: this.clusters.length, 
      fps: this.frameCount,
      latestMessage: newMessage,
      mode: this.isTraining ? 'TRAINING' : (this.inputQueue.length > 0 ? 'READING' : (this.isThinking ? 'THINKING' : 'IDLE')),
      zoomLevel: this.currentZoom,
      queueLength: this.inputQueue.length,
      isLearningMode: this.isLearningMode,
      currentLesson: this.isTraining ? this.teacherState.status : undefined,
      trainingTopic: this.trainingTopic,
      studentResponse: this.teacherState.thoughtProcess,
      teacherState: this.teacherState,
      diagnostics: this.runDiagnostics(),
      config: this.config
    };
  }
  
  updateConfig(newConfig: Partial<SystemConfig>) {
      this.config = { ...this.config, ...newConfig };
  }

  startThinking() { this.isThinking = true; }
  stopThinking() { this.isThinking = false; }
  toggleFreeze() { this.isFrozen = !this.isFrozen; }
  toggleLearningMode() { this.isLearningMode = !this.isLearningMode; }
  consolidateMemory() { this.isSleeping = true; setTimeout(()=>this.isSleeping=false, 2000); }
  exportState() { return JSON.stringify({neurons: this.neurons, clusters: this.clusters, config: this.config}); }
  importState(json: string) { 
      const data = JSON.parse(json);
      if(data.neurons) this.neurons = data.neurons;
      if(data.config) this.config = data.config;
  }
}
