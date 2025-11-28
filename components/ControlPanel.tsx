
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
  onReward: () => void;
  onPunish: () => void;
  onSleep: () => void;
  onImageUpload: (file: File) => void;
  renderEnabled: boolean;
  setRenderEnabled: (val: boolean) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
    stats, chatHistory, onTextInput, 
    onStartThinking, onStopThinking, onToggleFreeze,
    onSave, onLoad, onReward, onPunish, onSleep, onImageUpload,
    renderEnabled, setRenderEnabled 
}) => {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

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

  const handleImgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        onImageUpload(e.target.files[0]);
    }
  };

  return (
    <div className="h-full w-96 bg-slate-900 border-l border-slate-700 flex flex-col shadow-2xl z-20">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-900">
        <h2 className="text-white font-black text-xl flex items-center justify-between">
            <span>BIO-NET V7</span>
            <span className={`text-xs px-2 py-1 rounded ${
                stats.mode === 'THINKING' ? 'bg-purple-500 text-white animate-pulse' :
                stats.mode === 'SLEEPING' ? 'bg-indigo-500 text-white animate-pulse' :
                stats.mode === 'FROZEN' ? 'bg-red-500 text-white' : 
                'bg-green-500/20 text-green-400'
            }`}>
                {stats.mode}
            </span>
        </h2>
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono text-slate-400">
            <div className="bg-slate-800 p-2 rounded">
                <span className="block text-slate-500">NEURONS</span>
                <span className="text-white font-bold">{stats.neuronCount}</span>
            </div>
            <div className="bg-slate-800 p-2 rounded">
                <span className="block text-slate-500">SYNAPSES</span>
                <span className="text-blue-400 font-bold">{stats.synapseCount}</span>
            </div>
        </div>
      </div>

      {/* Reinforcement Learning */}
      <div className="p-3 grid grid-cols-2 gap-2 border-b border-slate-800 bg-slate-800/30">
          <button onClick={onReward} className="bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded font-bold text-lg shadow-lg">
            👍 LOB
          </button>
          <button onClick={onPunish} className="bg-rose-600 hover:bg-rose-500 text-white py-2 rounded font-bold text-lg shadow-lg">
            👎 KRITIK
          </button>
          <p className="col-span-2 text-[10px] text-slate-500 text-center uppercase tracking-widest">Bestärkendes Lernen</p>
      </div>

      {/* Cognitive Controls */}
      <div className="p-3 grid grid-cols-3 gap-2 border-b border-slate-800">
          <button 
            onMouseDown={onStartThinking}
            onMouseUp={onStopThinking}
            className="bg-purple-700 hover:bg-purple-600 text-white py-2 rounded font-bold text-xs"
          >
            NACHDENKEN
          </button>
          <button 
            onClick={onSleep}
            className="bg-indigo-700 hover:bg-indigo-600 text-white py-2 rounded font-bold text-xs"
          >
            SCHLAFEN (OPT)
          </button>
          <button 
            onClick={onToggleFreeze}
            className={`${stats.mode === 'FROZEN' ? 'bg-red-600' : 'bg-slate-700'} text-white py-2 rounded font-bold text-xs`}
          >
            PAUSE
          </button>
      </div>

      {/* Persistence Controls */}
      <div className="p-3 grid grid-cols-3 gap-2 border-b border-slate-800 bg-slate-800/50">
          <button 
            onClick={onSave}
            className="bg-slate-700 hover:bg-slate-600 text-white py-1 rounded text-[10px]"
          >
            SAVE JSON
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-700 hover:bg-slate-600 text-white py-1 rounded text-[10px]"
          >
            LOAD JSON
          </button>
          <button 
            onClick={() => imgInputRef.current?.click()}
            className="bg-sky-700 hover:bg-sky-600 text-white py-1 rounded text-[10px]"
          >
            👁️ BILD
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
          <input type="file" ref={imgInputRef} onChange={handleImgChange} className="hidden" accept="image/*" />
      </div>

      {/* Chat Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm bg-slate-950">
        {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-2 rounded-lg ${
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
                placeholder="Sprich mit der KI..."
                className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold">➜</button>
        </form>
        
        <label className="mt-3 flex items-center gap-2 cursor-pointer text-xs text-slate-500 hover:text-white">
            <input type="checkbox" checked={renderEnabled} onChange={(e) => setRenderEnabled(e.target.checked)} className="rounded bg-slate-700"/>
            VISUALISIERUNG AN/AUS
        </label>
      </div>

    </div>
  );
};

export default ControlPanel;
