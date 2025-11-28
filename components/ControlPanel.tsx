import React, { useRef, useState } from 'react';
import { BrainStats } from '../types';

interface ControlPanelProps {
  stats: BrainStats;
  onTextInput: (text: string) => void;
  onImageInput: (file: File) => void;
  renderEnabled: boolean;
  setRenderEnabled: (val: boolean) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
    stats, onTextInput, onImageInput, renderEnabled, setRenderEnabled 
}) => {
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Web Speech API
  const toggleMic = () => {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Browser unterstützt keine Spracherkennung.");
        return;
    }
    
    if (isListening) {
        setIsListening(false);
        return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'de-DE';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("Gehört:", transcript);
        onTextInput(transcript);
    };

    recognition.start();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          // Determine type
          if (file.type.startsWith('image/')) {
              onImageInput(file);
          } else if (file.type === 'text/plain') {
              const reader = new FileReader();
              reader.onload = (ev) => {
                  if (ev.target?.result) onTextInput(ev.target.result as string);
              };
              reader.readAsText(file);
          }
      }
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-700 p-4 rounded-xl shadow-2xl flex flex-wrap items-center gap-4 text-white">
      
      {/* Inputs */}
      <div className="flex items-center gap-2 border-r border-slate-700 pr-4">
        <button 
            onClick={toggleMic}
            className={`p-3 rounded-full border transition-all ${isListening ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' : 'bg-slate-800 border-slate-600 hover:bg-slate-700'}`}
            title="Mikrofon aktivieren"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
        </button>

        <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-full bg-slate-800 border border-slate-600 hover:bg-slate-700"
            title="Datei hochladen (Bild/Text)"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </button>
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,text/plain" 
        />
      </div>

      {/* Stats */}
      <div className="flex-1 flex gap-6 text-xs font-mono">
        <div>
            <div className="text-slate-500">NEURONEN</div>
            <div className="text-xl font-bold">{stats.neuronCount}</div>
        </div>
        <div>
            <div className="text-slate-500">SYNAPSEN</div>
            <div className="text-xl font-bold text-blue-400">{stats.synapseCount}</div>
        </div>
        <div>
            <div className="text-slate-500">INPUT AKTIVITÄT</div>
            <div className="w-24 h-4 bg-slate-800 rounded overflow-hidden">
                <div className="h-full bg-pink-500 transition-all duration-75" style={{ width: `${Math.min(100, stats.inputActivity * 10)}%` }}></div>
            </div>
        </div>
        <div>
            <div className="text-slate-500">OUTPUT AKTIVITÄT</div>
            <div className="w-24 h-4 bg-slate-800 rounded overflow-hidden">
                <div className="h-full bg-green-500 transition-all duration-75" style={{ width: `${Math.min(100, stats.outputActivity * 10)}%` }}></div>
            </div>
        </div>
      </div>

      {/* Settings */}
      <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
        <label className="flex items-center gap-2 cursor-pointer">
            <input 
                type="checkbox" 
                checked={renderEnabled} 
                onChange={(e) => setRenderEnabled(e.target.checked)} 
                className="rounded bg-slate-800 border-slate-600"
            />
            <span className="text-xs text-slate-400">VISUALISIERUNG</span>
        </label>
      </div>

    </div>
  );
};

export default ControlPanel;