
import React, { useState, useEffect, useRef } from 'react';
import BrainCanvas from './components/BrainCanvas';
import ControlPanel from './components/ControlPanel';
import { BioEngine } from './services/BioEngine';
import { BrainStats, ChatMessage } from './types';

const App: React.FC = () => {
  const engineRef = useRef<BioEngine>(new BioEngine(window.innerWidth, window.innerHeight));
  
  const [stats, setStats] = useState<BrainStats>({ 
      neuronCount: 0, synapseCount: 0, clusterCount: 0, fps: 0, mode: 'IDLE', zoomLevel: 1
  });
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [renderEnabled, setRenderEnabled] = useState(true);

  const lastMsgTime = useRef(0);

  const handleStatsUpdate = (newStats: BrainStats) => {
      setStats(newStats);

      if (newStats.latestMessage) {
          const msg = newStats.latestMessage;
          if (Date.now() - lastMsgTime.current > 1000) {
              setChatHistory(prev => [...prev, msg]);
              lastMsgTime.current = Date.now();
          }
      }
  };

  const handleTextInput = (text: string) => {
      setChatHistory(prev => [...prev, {
          sender: 'USER',
          text: text,
          timestamp: Date.now()
      }]);
      engineRef.current.processInput(text);
  };

  // --- Persistence Handlers ---
  const handleSave = () => {
      const json = engineRef.current.exportState();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `bionet_memory_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleLoad = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          const content = e.target?.result as string;
          if (content) {
              engineRef.current.importState(content);
              setChatHistory(prev => [...prev, {
                  sender: 'SYSTEM',
                  text: 'MEMORY RESTORED.',
                  timestamp: Date.now()
              }]);
          }
      };
      reader.readAsText(file);
  };

  const startThinking = () => engineRef.current.startThinking();
  const stopThinking = () => engineRef.current.stopThinking();
  const toggleFreeze = () => engineRef.current.toggleFreeze();

  return (
    <div className="w-full h-screen relative bg-slate-950 overflow-hidden font-sans select-none flex">
      
      {/* Sidebar Control Panel */}
      <ControlPanel 
        stats={stats}
        chatHistory={chatHistory}
        onTextInput={handleTextInput}
        onStartThinking={startThinking}
        onStopThinking={stopThinking}
        onToggleFreeze={toggleFreeze}
        onSave={handleSave}
        onLoad={handleLoad}
        renderEnabled={renderEnabled}
        setRenderEnabled={setRenderEnabled}
      />

      {/* Main Canvas Area */}
      <div className="flex-1 relative h-full">
          <BrainCanvas 
            engine={engineRef.current}
            onStatsUpdate={handleStatsUpdate}
            renderEnabled={renderEnabled}
          />
          
          <div className="absolute bottom-6 right-6 pointer-events-none text-right">
             <h1 className="text-6xl font-black text-slate-800 tracking-tighter mix-blend-difference opacity-50">
               DEEP LEARNING
             </h1>
          </div>
      </div>
    </div>
  );
};

export default App;
