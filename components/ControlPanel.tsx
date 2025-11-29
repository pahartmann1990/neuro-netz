
import React, { useState, useEffect, useRef } from 'react';
import { BrainStats, ChatMessage, SystemConfig } from '../types';

interface ControlPanelProps {
  stats: BrainStats;
  chatHistory: ChatMessage[];
  activeSessionId: number;
  setActiveSessionId: (id: number) => void;
  sessions: number[];
  addSession: () => void;
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
  onToggleLearning: () => void;
  onStartTeacher: (topic: string) => void;
  onStopTeacher: () => void;
  onUpdateConfig: (config: Partial<SystemConfig>) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
    stats, chatHistory, activeSessionId, setActiveSessionId, sessions, addSession,
    onTextInput, onStartThinking, onStopThinking, onToggleFreeze,
    onSave, onLoad, onReward, onPunish, onSleep, onImageUpload,
    renderEnabled, setRenderEnabled, onToggleLearning,
    onStartTeacher, onStopTeacher, onUpdateConfig
}) => {
  const [inputText, setInputText] = useState('');
  const [docText, setDocText] = useState('');
  const [showDocInput, setShowDocInput] = useState(false);
  const [teacherInput, setTeacherInput] = useState('');
  const [showTeacherConsole, setShowTeacherConsole] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Config State
  const [n8nUrl, setN8nUrl] = useState(stats.config?.n8nWebhookUrl || '');
  const [localLlmUrl, setLocalLlmUrl] = useState(stats.config?.localLlmUrl || 'http://localhost:11434/api/generate');
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredHistory = chatHistory.filter(m => m.sessionId === activeSessionId || m.sessionId === 0 || m.sessionId === -1);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, activeSessionId]);

  useEffect(() => {
      if(stats.config) {
          setN8nUrl(stats.config.n8nWebhookUrl);
          setLocalLlmUrl(stats.config.localLlmUrl);
      }
  }, [stats.config]);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputText.trim()) return;
      onTextInput(inputText);
      setInputText('');
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!teacherInput.trim()) return;
      onStartTeacher(teacherInput); 
      setTeacherInput('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onLoad(e.target.files[0]);
    }
  };

  const handleConfigSave = () => {
      onUpdateConfig({
          n8nWebhookUrl: n8nUrl,
          localLlmUrl: localLlmUrl
      });
      setShowSettings(false);
  }

  return (
    <div className="h-full w-96 bg-slate-900 border-l border-slate-700 flex flex-col shadow-2xl z-20">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-900">
        <div className="flex justify-between items-center mb-2">
            <h2 className="text-white font-black text-xl">BIO-NET V16</h2>
            <div className="flex gap-1">
                 <button onClick={() => setShowSettings(!showSettings)} className="bg-slate-800 text-[10px] px-2 py-1 rounded border border-slate-600 hover:bg-slate-700">⚙ SYS</button>
                 <button onClick={() => setShowTeacherConsole(!showTeacherConsole)} className="bg-purple-900/50 text-[10px] px-2 py-1 rounded font-bold text-purple-300 border border-purple-500 hover:bg-purple-800 transition-colors">
                     {showTeacherConsole ? 'CLOSE' : 'AI MENTOR'}
                 </button>
            </div>
        </div>

        {showSettings && (
            <div className="mb-3 bg-slate-800 p-3 rounded border border-slate-600 animate-in slide-in-from-top-2">
                <h3 className="text-xs font-bold text-blue-300 mb-2">SYSTEM INTEGRATION</h3>
                
                <label className="text-[10px] text-slate-400 block">N8N Webhook URL (Output):</label>
                <input value={n8nUrl} onChange={e=>setN8nUrl(e.target.value)} className="w-full bg-slate-900 text-white text-[10px] p-1 mb-2 border border-slate-700 rounded" placeholder="https://your-n8n.com/webhook/..."/>
                
                <label className="text-[10px] text-slate-400 block">Local LLM URL (Ollama):</label>
                <input value={localLlmUrl} onChange={e=>setLocalLlmUrl(e.target.value)} className="w-full bg-slate-900 text-white text-[10px] p-1 mb-2 border border-slate-700 rounded" placeholder="http://localhost:11434/api/generate"/>
                
                <div className="flex items-center gap-2 mb-2">
                    <input type="checkbox" checked={stats.config?.useRealAi} onChange={e => onUpdateConfig({useRealAi: e.target.checked})} />
                    <span className="text-xs text-green-400">USE REAL LOCAL AI</span>
                </div>

                <button onClick={handleConfigSave} className="w-full bg-blue-600 text-white text-xs py-1 rounded font-bold">SAVE CONFIG</button>
            </div>
        )}

        {showTeacherConsole && (
            <div className="mb-3 bg-purple-950/30 p-3 rounded border border-purple-500/50 animate-in slide-in-from-top-2 duration-200">
                <label className="text-[10px] text-purple-300 block mb-1 font-bold">ANWEISUNG AN LEHRER-KI:</label>
                <form onSubmit={handleTeacherSubmit} className="flex gap-1">
                    <input 
                        type="text" 
                        value={teacherInput}
                        onChange={(e) => setTeacherInput(e.target.value)}
                        placeholder='z.B. "Bring ihm bei was ein Auto ist"'
                        className="w-full bg-slate-900 border border-purple-700 text-white text-xs p-2 rounded focus:outline-none focus:border-purple-400"
                    />
                    <button type="submit" className="bg-purple-600 text-white text-xs px-3 rounded font-bold hover:bg-purple-500">SEND</button>
                </form>
                <div className="mt-2 text-[9px] text-slate-400 font-mono flex justify-between">
                   <span>MODE: {stats.config?.useRealAi ? 'ONLINE (LOCAL LLM)' : 'OFFLINE (SIMULATION)'}</span>
                </div>
            </div>
        )}
        
        {/* Diagnostics Panel */}
        <div className="mb-2">
            <button onClick={() => setShowDiagnostics(!showDiagnostics)} className="text-[9px] text-slate-500 hover:text-white w-full text-left mb-1 flex items-center gap-1">
                {showDiagnostics ? '▼ DIAGNOSE' : '▶ DIAGNOSE'}
            </button>
            
            {showDiagnostics && stats.diagnostics && (
                <div className="bg-black/50 p-2 rounded border border-slate-800 text-[9px] font-mono space-y-1">
                    <div className="flex justify-between">
                        <span className="text-slate-400">Netzwerk-Gesundheit:</span>
                        <span className={stats.diagnostics.networkHealth > 50 ? 'text-green-400' : 'text-red-400'}>
                            {stats.diagnostics.networkHealth}%
                        </span>
                    </div>
                    {stats.teacherState && stats.teacherState.status !== 'IDLE' && (
                        <div className="mt-2 p-2 bg-purple-900/20 rounded border-l-2 border-purple-500">
                            <div className="text-purple-300 font-bold mb-1">TEACHER GEDANKEN:</div>
                            <div className="text-slate-300 italic leading-tight">{stats.teacherState.thoughtProcess}</div>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* Session Tabs */}
      <div className="flex overflow-x-auto bg-slate-950 border-b border-slate-800 scrollbar-hide">
          {sessions.map(id => (
              <button 
                key={id}
                onClick={() => setActiveSessionId(id)}
                className={`px-4 py-2 text-xs font-bold whitespace-nowrap ${
                    activeSessionId === id 
                    ? 'bg-slate-800 text-white border-b-2 border-blue-500' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                CHAT {id}
              </button>
          ))}
          <button onClick={addSession} className="px-3 py-2 text-xs font-bold text-green-500 hover:text-green-400 bg-slate-900">+</button>
      </div>

      {/* Reinforcement Controls */}
      <div className="p-2 grid grid-cols-2 gap-2 border-b border-slate-800 bg-slate-800/30">
          <button onClick={onReward} className="bg-emerald-600 hover:bg-emerald-500 text-white py-1 rounded font-bold text-xs shadow transition-all active:scale-95 flex items-center justify-center gap-1">
            <span>👍</span> GUT (Loben)
          </button>
          <button onClick={onPunish} className="bg-rose-600 hover:bg-rose-500 text-white py-1 rounded font-bold text-xs shadow transition-all active:scale-95 flex items-center justify-center gap-1">
            <span>👎</span> FALSCH (Tadeln)
          </button>
      </div>

      {/* Chat Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm bg-slate-950 relative">
        {showDocInput ? (
            <div className="absolute inset-0 bg-slate-900 p-4 z-10 flex flex-col">
                <h3 className="text-white text-xs font-bold mb-2">DOKUMENT IMPORT:</h3>
                <textarea 
                    className="flex-1 bg-slate-800 text-slate-300 text-xs p-2 rounded resize-none focus:outline-none border border-slate-600"
                    placeholder="Text hier einfügen..."
                    value={docText}
                    onChange={e => setDocText(e.target.value)}
                />
                <div className="flex gap-2 mt-2">
                    <button onClick={() => setShowDocInput(false)} className="flex-1 bg-slate-700 text-white py-1 rounded text-xs">ABBRECHEN</button>
                    <button onClick={() => { onTextInput(docText); setShowDocInput(false); }} className="flex-1 bg-blue-600 text-white py-1 rounded text-xs font-bold">IMPORTIEREN</button>
                </div>
            </div>
        ) : (
            filteredHistory.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] p-2 rounded-lg shadow-md ${
                        msg.sender === 'USER' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : msg.sender === 'TEACHER'
                        ? 'bg-purple-900 text-purple-100 border border-purple-500 rounded-bl-none'
                        : msg.sender === 'SYSTEM'
                        ? 'bg-slate-800 text-gray-400 text-[10px] border border-slate-700 italic w-full text-center'
                        : 'bg-slate-800 text-emerald-400 rounded-bl-none border-l-2 border-emerald-500'
                    }`}>
                        {msg.sender !== 'SYSTEM' && (
                            <div className="text-[9px] uppercase tracking-wider opacity-50 mb-1 font-bold">
                                {msg.sender === 'SELF' ? 'BIO-NET (SCHÜLER)' : msg.sender === 'TEACHER' ? 'AI MENTOR' : 'DU'}
                            </div>
                        )}
                        {msg.text}
                    </div>
                </div>
            ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Tools Footer */}
      <div className="grid grid-cols-3 gap-1 p-2 bg-slate-900 text-[9px] border-t border-slate-800">
          <button onClick={onSave} className="bg-slate-800 text-slate-300 py-1 rounded hover:bg-slate-700 transition-colors">SAVE STATE</button>
          <button onClick={() => fileInputRef.current?.click()} className="bg-slate-800 text-slate-300 py-1 rounded hover:bg-slate-700 transition-colors">LOAD STATE</button>
          <button onClick={() => setShowDocInput(true)} className="bg-slate-800 text-slate-300 py-1 rounded hover:bg-slate-700 transition-colors">IMPORT TEXT</button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange}/>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700 bg-slate-900">
        <form onSubmit={handleSubmit} className="flex gap-2">
            <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Schreibe mit dem Bio-Net..."
                className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono transition-all"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold shadow-lg transition-all">➜</button>
        </form>
        
        <div className="mt-3 flex justify-between items-center">
             <button onClick={onToggleLearning} className={`text-[10px] px-3 py-1 rounded-full border transition-all ${stats.isLearningMode ? 'bg-emerald-900/50 text-emerald-300 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}>
                 {stats.isLearningMode ? '● TRAINING AKTIV' : '○ TRAINING INAKTIV'}
             </button>
             <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-500 hover:text-white transition-colors">
                <input type="checkbox" checked={renderEnabled} onChange={(e) => setRenderEnabled(e.target.checked)} className="rounded bg-slate-700 border-slate-600"/>
                3D VIEW
            </label>
        </div>
      </div>

    </div>
  );
};

export default ControlPanel;
