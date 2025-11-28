import React, { useState, useEffect } from 'react';
import BrainCanvas from './components/BrainCanvas';
import ControlPanel from './components/ControlPanel';
import { BrainStats } from './types';

const App: React.FC = () => {
  const [inputSignal, setInputSignal] = useState<string | null>(null);
  const [stats, setStats] = useState<BrainStats>({ 
      neuronCount: 0, synapseCount: 0, averageStress: 0, averageDopamine: 0, learningCycles: 0 
  });
  
  // Triggers for Save/Load
  const [saveTrigger, setSaveTrigger] = useState(0);
  const [loadTrigger, setLoadTrigger] = useState(0);
  
  // Auto-Training State
  const [isAutoTraining, setIsAutoTraining] = useState(false);

  const handleTeach = (text: string) => {
      setInputSignal(text);
      setTimeout(() => setInputSignal(null), 100);
  };

  // Auto-Trainer Logic (Simulates Browsing)
  useEffect(() => {
      let interval: ReturnType<typeof setInterval>;
      if (isAutoTraining) {
          const words = ["Code", "Logic", "Web", "Brain", "Neural", "React", "Data", "Input", "Output", "Learn"];
          interval = setInterval(() => {
              const word = words[Math.floor(Math.random() * words.length)];
              handleTeach(word);
          }, 800); // Feed a word every 800ms
      }
      return () => clearInterval(interval);
  }, [isAutoTraining]);

  return (
    <div className="w-full h-screen relative bg-black overflow-hidden font-sans">
      
      <BrainCanvas 
        inputSignal={inputSignal} 
        onStatsUpdate={setStats}
        saveTrigger={saveTrigger}
        loadTrigger={loadTrigger}
      />

      <ControlPanel 
        stats={stats}
        onTeach={handleTeach}
        onSave={() => setSaveTrigger(s => s + 1)}
        onLoad={() => setLoadTrigger(s => s + 1)}
        onAutoTrainToggle={setIsAutoTraining}
        isAutoTraining={isAutoTraining}
      />

      <div className="absolute top-4 left-4 pointer-events-none">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 opacity-90 tracking-tighter">
          NEURO-CORE
        </h1>
        <p className="text-white/40 text-xs font-mono mt-1 max-w-xs">
          Autonome Biologische Architektur.
          <br/>
          Keine externen Algorithmen. Reine Homöostase.
        </p>
      </div>

    </div>
  );
};

export default App;