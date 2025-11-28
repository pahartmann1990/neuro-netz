
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
  
  const [transform, setTransform] = useState<ViewportTransform>({ x: window.innerWidth/2, y: window.innerHeight/2, scale: 0.4 });
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
      const newScale = Math.min(Math.max(0.1, transform.scale - e.deltaY * zoomSensitivity), 5);
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
              const now = Date.now();

              // Background
              ctx.fillStyle = engine.isSleeping ? '#0f172a' : COLORS.BACKGROUND; 
              ctx.fillRect(0, 0, width, height);

              ctx.save();
              ctx.translate(transform.x, transform.y);
              ctx.scale(transform.scale, transform.scale);

              // --- DRAW ZONES ---
              // Sensory
              ctx.fillStyle = 'rgba(236, 72, 153, 0.03)';
              ctx.fillRect(PHYSICS.ZONE_SENSORY_X - 200, -1500, 400, 3000);
              // Language
              ctx.fillStyle = 'rgba(59, 130, 246, 0.03)';
              ctx.fillRect(PHYSICS.ZONE_LANGUAGE_X - 200, -1500, 400, 3000);
              // Memory
              ctx.fillStyle = 'rgba(139, 92, 246, 0.03)';
              ctx.fillRect(PHYSICS.ZONE_MEMORY_X - 300, -1500, 1200, 3000);

              // --- DRAW CONNECTIONS ---
              if (!engine.isSleeping) {
                engine.neurons.forEach(neuron => {
                    neuron.connections.forEach(syn => {
                        const target = engine.neurons.find(n => n.id === syn.targetId);
                        if (!target) return;

                        ctx.beginPath();
                        ctx.moveTo(neuron.x, neuron.y);
                        ctx.lineTo(target.x, target.y);
                        
                        const isActive = (now - syn.lastActive) < 250;
                        
                        if (isActive) {
                            ctx.strokeStyle = '#fbbf24'; 
                            ctx.lineWidth = Math.min(5, syn.weight) / transform.scale;
                            ctx.globalAlpha = 1;
                        } else {
                            ctx.strokeStyle = '#334155';
                            ctx.lineWidth = Math.min(1, syn.weight * 0.1) / transform.scale;
                            ctx.globalAlpha = 0.15;
                        }
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    });
                });
              }

              // --- DRAW NEURONS ---
              engine.neurons.forEach(neuron => {
                  const isFiring = neuron.potential > 15;
                  
                  let color = COLORS.NEURON_BASE;
                  if (neuron.pixelIndex !== undefined) color = COLORS.NODE_VISUAL;
                  else if (neuron.isCompressed) color = COLORS.NODE_SYMBOL;
                  else if (neuron.label && /[.,!?;:]/.test(neuron.label)) color = COLORS.NODE_PUNCTUATION;
                  else if (neuron.regionId === 'SENSORY') color = COLORS.NODE_SENSORY;
                  else if (neuron.regionId === 'LANG_DE') color = COLORS.NODE_GERMAN;
                  else if (neuron.regionId === 'LANG_EN') color = COLORS.NODE_ENGLISH;
                  else if (neuron.regionId === 'MEMORY') color = COLORS.NODE_MEMORY;

                  if (isFiring) {
                      ctx.shadowColor = color;
                      ctx.shadowBlur = 30;
                      ctx.fillStyle = '#ffffff';
                  } else {
                      ctx.shadowBlur = 0;
                      ctx.fillStyle = color;
                  }

                  ctx.beginPath();
                  if (neuron.isCompressed) {
                      const s = 25;
                      ctx.rect(neuron.x - s/2, neuron.y - s/2, s, s);
                  } else if (neuron.pixelIndex !== undefined) {
                      // Rectangular pixels for visual cortex
                      ctx.rect(neuron.x - 6, neuron.y - 6, 12, 12);
                  } else {
                      const r = neuron.character ? 14 : 10;
                      ctx.arc(neuron.x, neuron.y, r, 0, Math.PI * 2);
                  }
                  ctx.fill();
                  
                  // Draw Label
                  if (transform.scale > 0.2 || isFiring) {
                      if (neuron.character || neuron.label) {
                          ctx.fillStyle = '#fff';
                          ctx.font = neuron.isCompressed ? 'bold 18px monospace' : '12px sans-serif';
                          ctx.textAlign = 'center';
                          const yOff = neuron.character ? 5 : 24;
                          ctx.fillText(neuron.character || neuron.label || '', neuron.x, neuron.y + yOff);
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
      
      {/* Zone Labels Overlay */}
      <div className="absolute top-4 left-0 w-full flex justify-between px-20 pointer-events-none text-slate-600 font-bold text-xs tracking-widest opacity-40">
          <div style={{ width: '30%', textAlign: 'center' }}>SENSORY (VISUAL/TEXT)</div>
          <div style={{ width: '30%', textAlign: 'center' }}>LANGUAGE PROCESSING</div>
          <div style={{ width: '30%', textAlign: 'center' }}>CONCEPT MEMORY</div>
      </div>
    </div>
  );
};

export default BrainCanvas;
