
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
          // Prevent duplicate messages spamming the chat
          if (Date.now() - lastMsgTime.current > 500) {
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

  const handleImageUpload = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
              // Downscale image to 10x10 pixel array for simple visual cortex simulation
              const canvas = document.createElement('canvas');
              canvas.width = 10;
              canvas.height = 10;
              const ctx = canvas.getContext('2d');
              if(ctx) {
                  ctx.drawImage(img, 0, 0, 10, 10);
                  const data = ctx.getImageData(0, 0, 10, 10).data;
                  const grayscale = new Uint8Array(100);
                  for(let i=0; i<100; i++) {
                      // Simple avg for grayscale
                      grayscale[i] = (data[i*4] + data[i*4+1] + data[i*4+2]) / 3;
                  }
                  engineRef.current.processVisualInput(grayscale);
                  setChatHistory(prev => [...prev, {
                    sender: 'SYSTEM', text: 'VISUAL INPUT RECEIVED (10x10 Retina)', timestamp: Date.now()
                  }]);
              }
          };
          img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
  };

  // --- Persistence Handlers ---
  const handleSave = () => {
      const json = engineRef.current.exportState();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `bionet_v7_${Date.now()}.json`;
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
          }
      };
      reader.readAsText(file);
  };

  const startThinking = () => engineRef.current.startThinking();
  const stopThinking = () => engineRef.current.stopThinking();
  const toggleFreeze = () => engineRef.current.toggleFreeze();
  const triggerSleep = () => engineRef.current.consolidateMemory();
  
  const reward = () => engineRef.current.applyReinforcement('REWARD');
  const punish = () => engineRef.current.applyReinforcement('PUNISH');

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
        onReward={reward}
        onPunish={punish}
        onSleep={triggerSleep}
        onImageUpload={handleImageUpload}
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
               COGNITIVE EVOLUTION
             </h1>
          </div>
      </div>
    </div>
  );
};

export default App;
