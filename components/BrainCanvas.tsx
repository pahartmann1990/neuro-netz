
import React, { useEffect, useRef, useState } from 'react';
import { BioEngine } from '../services/BioEngine';
import { BrainStats, ViewportTransform } from '../types';
import { COLORS, PHYSICS } from '../constants';

interface BrainCanvasProps {
  engine: BioEngine;
  onStatsUpdate: (stats: BrainStats) => void;
  renderEnabled: boolean;
}

const BrainCanvas: React.FC<BrainCanvasProps> = ({ engine, onStatsUpdate, renderEnabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [transform, setTransform] = useState<ViewportTransform>({ x: window.innerWidth/2, y: window.innerHeight/2, scale: 0.3 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleResize = () => {
        if (containerRef.current && canvasRef.current) {
            canvasRef.current.width = containerRef.current.clientWidth;
            canvasRef.current.height = containerRef.current.clientHeight;
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
      const zoomSensitivity = 0.001;
      const newScale = Math.min(Math.max(0.05, transform.scale - e.deltaY * zoomSensitivity), 5);
      setTransform(prev => ({ ...prev, scale: newScale }));
      engine.currentZoom = newScale;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (isDragging) {
          const dx = e.clientX - lastMousePos.x;
          const dy = e.clientY - lastMousePos.y;
          setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
          setLastMousePos({ x: e.clientX, y: e.clientY });
      }
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    let animationId: number;
    const render = () => {
      const stats = engine.tick();
      onStatsUpdate(stats);

      if (renderEnabled && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
              const width = canvasRef.current.width;
              const height = canvasRef.current.height;

              // Background
              ctx.fillStyle = COLORS.BACKGROUND; 
              ctx.fillRect(0, 0, width, height);

              ctx.save();
              ctx.translate(transform.x, transform.y);
              ctx.scale(transform.scale, transform.scale);

              // --- DRAW LAYERS (Vertical Strips) ---
              // Layer 1
              ctx.fillStyle = COLORS.LAYER_1 + '11';
              ctx.fillRect(PHYSICS.LAYER_1_X - 100, -2000, 200, 4000);
              // Layer 2
              ctx.fillStyle = COLORS.LAYER_2 + '11';
              ctx.fillRect(PHYSICS.LAYER_2_X - 100, -2000, 200, 4000);
              // Layer 3
              ctx.fillStyle = COLORS.LAYER_3 + '11';
              ctx.fillRect(PHYSICS.LAYER_3_X - 100, -2000, 200, 4000);
              // Layer 4
              ctx.fillStyle = COLORS.LAYER_4 + '11';
              ctx.fillRect(PHYSICS.LAYER_4_X - 100, -2000, 200, 4000);

              // --- DRAW CONNECTIONS ---
              engine.neurons.forEach(neuron => {
                  neuron.connections.forEach(syn => {
                      const target = engine.neurons.find(n => n.id === syn.targetId);
                      if (!target) return;

                      ctx.beginPath();
                      ctx.moveTo(neuron.x, neuron.y);
                      ctx.lineTo(target.x, target.y);
                      
                      const now = Date.now();
                      const isActive = (now - syn.lastActive) < 200;
                      
                      if (isActive) {
                          ctx.strokeStyle = '#fbbf24'; 
                          ctx.lineWidth = Math.min(8, syn.weight) / transform.scale;
                          ctx.globalAlpha = 1;
                      } else {
                          ctx.strokeStyle = '#475569';
                          ctx.lineWidth = Math.min(2, syn.weight * 0.2) / transform.scale;
                          ctx.globalAlpha = 0.2;
                      }
                      ctx.stroke();
                      ctx.globalAlpha = 1;
                  });
              });

              // --- DRAW NEURONS ---
              engine.neurons.forEach(neuron => {
                  const isFiring = neuron.potential > 15;
                  
                  let color = COLORS.NEURON_BASE;
                  if (neuron.regionId === 'LAYER_1') color = COLORS.LAYER_1;
                  if (neuron.regionId === 'LAYER_2') color = COLORS.LAYER_2;
                  if (neuron.regionId === 'LAYER_3') color = COLORS.LAYER_3;
                  if (neuron.regionId === 'LAYER_4') color = COLORS.LAYER_4;
                  if (neuron.regionId === 'SENSORY') color = COLORS.NODE_SENSORY;

                  if (isFiring) {
                      ctx.shadowColor = color;
                      ctx.shadowBlur = 40;
                      ctx.fillStyle = '#ffffff';
                  } else {
                      ctx.shadowBlur = 0;
                      ctx.fillStyle = color;
                  }

                  ctx.beginPath();
                  // Visual distinction for layers
                  if (neuron.regionId.startsWith('LAYER')) {
                      ctx.rect(neuron.x - 10, neuron.y - 10, 20, 20);
                  } else {
                      ctx.arc(neuron.x, neuron.y, 12, 0, Math.PI * 2);
                  }
                  ctx.fill();
                  
                  // Labels
                  if (transform.scale > 0.15 || isFiring) {
                      if (neuron.label) {
                          ctx.fillStyle = '#fff';
                          ctx.font = '14px sans-serif';
                          ctx.textAlign = 'center';
                          ctx.fillText(neuron.label, neuron.x, neuron.y - 20);
                      }
                  }
              });

              ctx.shadowBlur = 0;
              ctx.restore();
          }
      }
      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [engine, renderEnabled, onStatsUpdate, transform]);

  return (
    <div 
        ref={containerRef} 
        className="w-full h-full bg-slate-950 cursor-move overflow-hidden"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
    >
      <canvas ref={canvasRef} className="block" />
      
      {/* Layer Labels */}
      <div className="absolute top-4 left-0 w-full flex justify-center pointer-events-none text-slate-500 font-mono text-xs opacity-60">
          <div className="w-[300px] text-center ml-[10%]">INPUT / LANG</div>
          <div className="w-[300px] text-center">ENCODE</div>
          <div className="w-[300px] text-center">HIDDEN</div>
          <div className="w-[300px] text-center">ABSTRACT</div>
          <div className="w-[300px] text-center">OUTPUT</div>
      </div>
    </div>
  );
};

export default BrainCanvas;
