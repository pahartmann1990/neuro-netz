import React, { useState, useEffect, useRef } from 'react';
import BrainCanvas from './components/BrainCanvas';
import ControlPanel from './components/ControlPanel';
import { BioEngine } from './services/BioEngine';
import { BrainStats } from './types';

const App: React.FC = () => {
  // Engine instance persists across renders
  const engineRef = useRef<BioEngine>(new BioEngine(window.innerWidth, window.innerHeight));
  
  const [stats, setStats] = useState<BrainStats>({ 
      neuronCount: 0, synapseCount: 0, inputActivity: 0, outputActivity: 0, fps: 0 
  });
  
  const [renderEnabled, setRenderEnabled] = useState(true);

  const handleTextInput = (text: string) => {
      console.log("Injecting Text:", text);
      engineRef.current.processTextInput(text);
  };

  const handleImageInput = (file: File) => {
      console.log("Processing Image...");
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
          // Draw to a hidden canvas to extract pixels
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
              // Downscale for neural processing (32x32 is enough for basic patterns)
              canvas.width = 32;
              canvas.height = 32;
              ctx.drawImage(img, 0, 0, 32, 32);
              const imgData = ctx.getImageData(0, 0, 32, 32);
              engineRef.current.processVisualInput(imgData.data, 32, 32);
          }
          URL.revokeObjectURL(url);
      };
      img.src = url;
  };

  return (
    <div className="w-full h-screen relative bg-black overflow-hidden font-sans select-none">
      
      <BrainCanvas 
        engine={engineRef.current}
        onStatsUpdate={setStats}
        renderEnabled={renderEnabled}
      />

      <div className="absolute top-6 left-6 pointer-events-none">
         <h1 className="text-4xl font-black text-white tracking-tighter mix-blend-difference">
           NEURO<span className="text-teal-500">CORE</span> V2
         </h1>
         <div className="text-slate-400 font-mono text-xs mt-2">
            BIOLOGISCHE ARCHITEKTUR <br/>
            KEINE SIMULATION VON ZEIT-ZERFALL
         </div>
      </div>

      <ControlPanel 
        stats={stats}
        onTextInput={handleTextInput}
        onImageInput={handleImageInput}
        renderEnabled={renderEnabled}
        setRenderEnabled={setRenderEnabled}
      />
    </div>
  );
};

export default App;