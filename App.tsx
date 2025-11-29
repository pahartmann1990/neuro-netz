
import React, { useState, useEffect, useRef } from 'react';
import BrainCanvas from './components/BrainCanvas';
import ControlPanel from './components/ControlPanel';
import { BioEngine } from './services/BioEngine';
import { BrainStats, ChatMessage, SystemConfig } from './types';

const App: React.FC = () => {
  const engineRef = useRef<BioEngine>(new BioEngine(window.innerWidth, window.innerHeight));
  
  const [stats, setStats] = useState<BrainStats>({ 
      neuronCount: 0, synapseCount: 0, clusterCount: 0, fps: 0, mode: 'IDLE', zoomLevel: 1, queueLength: 0, isLearningMode: false
  });
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [renderEnabled, setRenderEnabled] = useState(true);
  const [sessions, setSessions] = useState<number[]>([1]);
  const [activeSessionId, setActiveSessionId] = useState<number>(1);

  const lastMsgTime = useRef(0);

  const handleStatsUpdate = (newStats: BrainStats) => {
      setStats(newStats);

      // Pull pending messages from engine
      if (engineRef.current.pendingSystemMessages.length > 0) {
          const msgs = engineRef.current.pendingSystemMessages.splice(0, engineRef.current.pendingSystemMessages.length);
          msgs.forEach(msg => {
             if (msg.sessionId === 0) msg.sessionId = activeSessionId; 
          });
          setChatHistory(prev => [...prev, ...msgs]);
      }

      if (newStats.latestMessage) {
          const msg = newStats.latestMessage;
          if (msg.sessionId === -1) msg.sessionId = activeSessionId;
          
          if (Date.now() - lastMsgTime.current > 100) {
              setChatHistory(prev => [...prev, msg]);
              lastMsgTime.current = Date.now();
          }
      }
  };

  const handleTextInput = (text: string) => {
      setChatHistory(prev => [...prev, {
          id: Math.random().toString(36).substr(2,9),
          sessionId: activeSessionId,
          sender: 'USER',
          text: text,
          timestamp: Date.now()
      }]);
      
      engineRef.current.processInput(text);
  };

  const handleTeacherCommand = (command: string) => {
      setChatHistory(prev => [...prev, {
          id: Math.random().toString(36).substr(2,9),
          sessionId: activeSessionId,
          sender: 'USER',
          text: `(Anweisung an Mentor): ${command}`,
          timestamp: Date.now()
      }]);
      engineRef.current.processTeacherCommand(command);
  };

  const handleAddSession = () => {
      const newId = sessions.length + 1;
      setSessions([...sessions, newId]);
      setActiveSessionId(newId);
  };

  const handleSave = () => {
      const json = engineRef.current.exportState();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bionet_sys_v16_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const handleLoad = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          const content = e.target?.result as string;
          if (content) engineRef.current.importState(content);
      };
      reader.readAsText(file);
  };

  const handleUpdateConfig = (config: Partial<SystemConfig>) => {
      engineRef.current.updateConfig(config);
  }

  return (
    <div className="w-full h-screen relative bg-slate-950 overflow-hidden font-sans select-none flex">
      <ControlPanel 
        stats={stats}
        chatHistory={chatHistory}
        activeSessionId={activeSessionId}
        setActiveSessionId={setActiveSessionId}
        sessions={sessions}
        addSession={handleAddSession}
        onTextInput={handleTextInput}
        onStartThinking={() => engineRef.current.startThinking()}
        onStopThinking={() => engineRef.current.stopThinking()}
        onToggleFreeze={() => engineRef.current.toggleFreeze()}
        onSave={handleSave}
        onLoad={handleLoad}
        onReward={() => engineRef.current.applyReinforcement('REWARD')}
        onPunish={() => engineRef.current.applyReinforcement('PUNISH')}
        onSleep={() => engineRef.current.consolidateMemory()}
        onImageUpload={() => {}}
        renderEnabled={renderEnabled}
        setRenderEnabled={setRenderEnabled}
        onToggleLearning={() => engineRef.current.toggleLearningMode()}
        onStartTeacher={handleTeacherCommand} 
        onStopTeacher={() => engineRef.current.stopAiTraining()}
        onUpdateConfig={handleUpdateConfig}
      />

      <div className="flex-1 relative h-full">
          <BrainCanvas 
            engine={engineRef.current}
            onStatsUpdate={handleStatsUpdate}
            renderEnabled={renderEnabled}
          />
          <div className="absolute bottom-6 right-6 pointer-events-none text-right">
             <h1 className="text-6xl font-black text-slate-800 tracking-tighter mix-blend-difference opacity-50">
               SYSTEM INTEGRATION
             </h1>
          </div>
      </div>
    </div>
  );
};

export default App;
