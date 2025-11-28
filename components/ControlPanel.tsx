import React, { useState, useEffect } from 'react';
import { BrainStats } from '../types';

interface ControlPanelProps {
  stats: BrainStats;
  onTeach: (text: string) => void;
  onSave: () => void;
  onLoad: () => void;
  onAutoTrainToggle: (active: boolean) => void;
  isAutoTraining: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ stats, onTeach, onSave, onLoad, onAutoTrainToggle, isAutoTraining }) => {
  const [inputText, setInputText] = useState("");
  const [log, setLog] = useState<string[]>([]);

  // Internal log for visualization of "thought process"
  const addToLog = (msg: string) => {
      setLog(prev => [msg, ...prev].slice(0, 5));
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(inputText.trim()) {
          onTeach(inputText);
          addToLog(`> Input: "${inputText}"`);
          setInputText("");
      }
  }

  // Effect to show simulated browser activity when auto-training
  useEffect(() => {
      if (isAutoTraining) {
          const interval = setInterval(() => {
              const topics = ["HTML", "Python", "React", "Node", "Data", "Web"];
              const randomTopic = topics[Math.floor(Math.random() * topics.length)];
              addToLog(`> Auto-Web-Suche: "${randomTopic}"`);
          }, 2000);
          return () => clearInterval(interval);
      }
  }, [isAutoTraining]);

  return (
    <div className="absolute top-4 right-4 w-96 bg-black/80 backdrop-blur-md border border-slate-800 p-6 rounded-xl shadow-2xl text-white font-mono">
      <div className="flex justify-between items-end mb-4 border-b border-slate-800 pb-2">
        <div>
            <h2 className="text-xl font-bold text-teal-400">CORE SYSTEM</h2>
            <p className="text-xs text-slate-500">Status: {isAutoTraining ? "AUTONOMOUS LEARNING" : "IDLE / WAITING"}</p>
        </div>
        <div className="flex gap-2">
            <button onClick={onSave} className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-600">SAVE</button>
            <button onClick={onLoad} className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-600">LOAD</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase">Neuronen</p>
            <p className="text-xl font-bold text-white">{stats.neuronCount}</p>
        </div>
        <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase">Synapsen</p>
            <p className="text-xl font-bold text-blue-400">{stats.synapseCount}</p>
        </div>
        <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase">Stress (Last)</p>
            <div className="w-full bg-slate-800 h-2 mt-1 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${Math.min(100, stats.averageStress * 5)}%` }}></div>
            </div>
        </div>
        <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase">Dopamin (Lernen)</p>
            <div className="w-full bg-slate-800 h-2 mt-1 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${Math.min(100, stats.averageDopamine * 100)}%` }}></div>
            </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="mb-6">
        <label className="text-xs font-bold text-slate-400 mb-2 block">MANUELLER INPUT</label>
        <form onSubmit={handleSubmit} className="flex gap-2">
            <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Sprache eingeben..."
                className="w-full bg-black border border-slate-700 rounded px-3 py-2 text-sm text-teal-400 focus:outline-none focus:border-teal-500 font-mono"
            />
            <button type="submit" className="bg-teal-900/50 border border-teal-700 hover:bg-teal-800 text-teal-400 px-4 py-2 rounded text-xs font-bold transition-colors">
                SEND
            </button>
        </form>
      </div>

      {/* Auto-Web Simulation */}
      <div className="border-t border-slate-800 pt-4">
        <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-slate-400">WEB-BROWSER SIMULATION</label>
            <button 
                onClick={() => onAutoTrainToggle(!isAutoTraining)}
                className={`text-[10px] px-2 py-1 rounded font-bold border ${isAutoTraining ? 'bg-amber-900/30 border-amber-500 text-amber-500' : 'bg-slate-800 border-slate-600 text-slate-400'}`}
            >
                {isAutoTraining ? "STOP SCAN" : "START SCAN"}
            </button>
        </div>
        
        {/* Console Log */}
        <div className="bg-black border border-slate-800 p-2 rounded h-24 overflow-hidden flex flex-col justify-end">
            {log.map((line, i) => (
                <p key={i} className="text-[10px] text-slate-400 truncate animate-pulse">{line}</p>
            ))}
            {isAutoTraining && <p className="text-[10px] text-amber-500 animate-pulse">Scanning internet nodes...</p>}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;