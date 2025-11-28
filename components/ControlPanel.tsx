
import React, { useState, useEffect, useRef } from 'react';
import { BrainStats, ChatMessage } from '../types';

interface ControlPanelProps {
  stats: BrainStats;
  chatHistory: ChatMessage[];
  onTextInput: (text: string) => void;
  onStartThinking: () => void;
  onStopThinking: () => void;
  onToggleFreeze: () => void;
  onSave: () => void;
  onLoad: (file: File) => void;
  renderEnabled: boolean;
  setRenderEnabled: (val: boolean) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
    stats, chatHistory, onTextInput, 
    onStartThinking, onStopThinking, onToggleFreeze,
    onSave, onLoad,
    renderEnabled, setRenderEnabled 
}) => {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputText.trim()) return;
      onTextInput(inputText);
      setInputText('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onLoad(e.target.files[0]);
    }
  };

  return (
    <div className="h-full w-96 bg-slate-900 border-l border-slate-700 flex flex-col shadow-2xl z-20">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-900">
        <h2 className="text-white font-black text-xl flex items-center justify-between">
            <span>BIO-NET V5</span>
            <span className={`text-xs px-2 py-1 rounded ${
                stats.mode === 'THINKING' ? 'bg-purple-500 text-white animate-pulse' :
                stats.mode === 'FROZEN' ? 'bg-red-500 text-white' : 
                'bg-green-500/20 text-green-400'
            }`}>
                {stats.mode}
            </span>
        </h2>
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono text-slate-400">
            <div className="bg-slate-800 p-2 rounded">
                <span className="block text-slate-500">CLUSTERS</span>
                <span className="text-white font-bold">{stats.clusterCount}</span>
            </div>
            <div className="bg-slate-800 p-2 rounded">
                <span className="block text-slate-500">ZOOM</span>
                <span className="text-blue-400 font-bold">{(stats.zoomLevel * 100).toFixed(0)}%</span>
            </div>
        </div>
      </div>

      {/* Control Actions */}
      <div className="p-3 grid grid-cols-2 gap-2 border-b border-slate-800">
          <button 
            onMouseDown={onStartThinking}
            onMouseUp={onStopThinking}
            className="bg-purple-700 hover:bg-purple-600 active:scale-95 text-white py-3 rounded font-bold text-sm shadow-lg shadow-purple-900/20"
          >
            NACHDENKEN
          </button>
          <button 
            onClick={onToggleFreeze}
            className={`${stats.mode === 'FROZEN' ? 'bg-red-600 animate-pulse' : 'bg-red-900 hover:bg-red-800'} text-white py-3 rounded font-bold text-sm shadow-lg`}
          >
            {stats.mode === 'FROZEN' ? 'FORTSETZEN' : 'NOT-AUS'}
          </button>
      </div>

      {/* Persistence Controls */}
      <div className="p-3 grid grid-cols-2 gap-2 border-b border-slate-800 bg-slate-800/50">
          <button 
            onClick={onSave}
            className="bg-emerald-700 hover:bg-emerald-600 text-white py-2 rounded text-xs font-bold"
          >
            💾 SPEICHERN (.JSON)
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-sky-700 hover:bg-sky-600 text-white py-2 rounded text-xs font-bold"
          >
            📂 LADEN
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".json"
          />
      </div>

      {/* Chat Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm bg-slate-950">
        {chatHistory.length === 0 && (
            <div className="text-slate-700 text-center mt-10 italic text-xs">
                -- BEREIT FÜR INPUT --<br/>
                Tippe Wörter. Das System lernt Zusammenhänge.<br/>
                Mausrad zum Zoomen.<br/>
                Drag zum Bewegen.
            </div>
        )}
        {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-2 rounded-lg ${
                    msg.sender === 'USER' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-slate-800 text-green-400 rounded-bl-none border border-green-900'
                }`}>
                    <div className="text-[9px] uppercase tracking-wider opacity-50 mb-1">{msg.sender}</div>
                    {msg.text}
                </div>
            </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-700 bg-slate-900">
        <form onSubmit={handleSubmit} className="flex gap-2">
            <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Eingabe..."
                className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
            />
            <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold transition-colors"
            >
                ➜
            </button>
        </form>
        
        <label className="mt-3 flex items-center gap-2 cursor-pointer text-xs text-slate-500 hover:text-white">
            <input 
                type="checkbox" 
                checked={renderEnabled} 
                onChange={(e) => setRenderEnabled(e.target.checked)} 
                className="rounded bg-slate-700 border-slate-600"
            />
            VISUALISIERUNG
        </label>
      </div>

    </div>
  );
};

export default ControlPanel;
