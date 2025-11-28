
import React, { useEffect, useRef, useState } from 'react';
import { BioEngine } from '../services/BioEngine';
import { BrainStats, ViewportTransform } from '../types';
import { COLORS } from '../constants';

interface BrainCanvasProps {
  engine: BioEngine;
  onStatsUpdate: (stats: BrainStats) => void;
  renderEnabled: boolean;
}

const BrainCanvas: React.FC<BrainCanvasProps> = ({ engine, onStatsUpdate, renderEnabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Viewport State (Zoom/Pan)
  const [transform, setTransform] = useState<ViewportTransform>({ x: window.innerWidth/2, y: window.innerHeight/2, scale: 0.8 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleResize = () => {
        if (containerRef.current && canvasRef.current) {
            canvasRef.current.width = containerRef.current.clientWidth;
            canvasRef.current.height = containerRef.current.clientHeight;
            engine.width = containerRef.current.clientWidth;
            engine.height = containerRef.current.clientHeight;
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, [engine]);

  // Mouse Interaction Handlers
  const handleWheel = (e: React.WheelEvent) => {
      const zoomSensitivity = 0.001;
      const newScale = Math.min(Math.max(0.1, transform.scale - e.deltaY * zoomSensitivity), 5);
      
      setTransform(prev => ({
          ...prev,
          scale: newScale
      }));
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
          setTransform(prev => ({
              ...prev,
              x: prev.x + dx,
              y: prev.y + dy
          }));
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

              // Clear
              ctx.fillStyle = COLORS.BACKGROUND; 
              ctx.fillRect(0, 0, width, height);

              // Apply Zoom/Pan
              ctx.save();
              ctx.translate(transform.x, transform.y);
              ctx.scale(transform.scale, transform.scale);

              // 1. Draw Clusters
              engine.clusters.forEach(cluster => {
                  const gradient = ctx.createRadialGradient(cluster.x, cluster.y, 0, cluster.x, cluster.y, cluster.radius);
                  gradient.addColorStop(0, cluster.color);
                  gradient.addColorStop(1, 'rgba(0,0,0,0)');
                  
                  ctx.fillStyle = gradient;
                  ctx.beginPath();
                  ctx.arc(cluster.x, cluster.y, cluster.radius, 0, Math.PI * 2);
                  ctx.fill();

                  // Label
                  ctx.fillStyle = 'rgba(255,255,255,0.4)';
                  ctx.font = 'bold 24px monospace';
                  ctx.textAlign = 'center';
                  ctx.fillText(cluster.label, cluster.x, cluster.y - cluster.radius - 10);
              });

              // 2. Draw Synapses
              ctx.lineCap = 'round';
              engine.neurons.forEach(neuron => {
                  neuron.connections.forEach(syn => {
                      const target = engine.neurons.find(n => n.id === syn.targetId);
                      if (!target) return;

                      ctx.beginPath();
                      ctx.moveTo(neuron.x, neuron.y);
                      ctx.lineTo(target.x, target.y);
                      
                      const isActive = (now - syn.lastActive) < 150;
                      
                      if (isActive) {
                          ctx.strokeStyle = '#fbbf24'; 
                          ctx.lineWidth = 3 / transform.scale;
                          ctx.globalAlpha = 1;
                      } else {
                          ctx.strokeStyle = '#334155';
                          ctx.lineWidth = Math.max(0.5, syn.weight * 0.5) / transform.scale;
                          ctx.globalAlpha = 0.2;
                      }
                      ctx.stroke();
                      ctx.globalAlpha = 1;
                  });
              });

              // 3. Draw Neurons
              engine.neurons.forEach(neuron => {
                  const isFiring = neuron.potential > neuron.threshold;
                  
                  ctx.beginPath();
                  // Compressed nodes are larger squares (Symbols)
                  if (neuron.isCompressed) {
                      const size = 20;
                      ctx.rect(neuron.x - size/2, neuron.y - size/2, size, size);
                  } else {
                      let r = 5;
                      if (neuron.character) r = 12; 
                      else if (neuron.label) r = 10; 
                      ctx.arc(neuron.x, neuron.y, r, 0, Math.PI * 2);
                  }
                  
                  if (isFiring) {
                      ctx.fillStyle = '#ffffff';
                      ctx.shadowColor = '#ffffff';
                      ctx.shadowBlur = 30;
                  } else {
                      if (neuron.isCompressed) ctx.fillStyle = COLORS.NEURON_COMPRESSED;
                      else if (neuron.regionId === 'INPUT') ctx.fillStyle = '#ec4899';
                      else if (neuron.label) ctx.fillStyle = '#22c55e'; 
                      else ctx.fillStyle = '#64748b'; 
                      ctx.shadowBlur = 0;
                  }
                  ctx.fill();

                  // Text
                  if (transform.scale > 0.4) { // LOD: Hide text if zoomed out too far
                      if (neuron.character) {
                          ctx.fillStyle = isFiring ? '#000' : '#fff';
                          ctx.font = 'bold 14px monospace';
                          ctx.textAlign = 'center';
                          ctx.textBaseline = 'middle';
                          ctx.fillText(neuron.character, neuron.x, neuron.y);
                      } else if (neuron.label) {
                          ctx.fillStyle = '#fff';
                          ctx.font = neuron.isCompressed ? 'bold 12px monospace' : '10px sans-serif';
                          ctx.textAlign = 'center';
                          ctx.fillText(neuron.label, neuron.x, neuron.y + (neuron.isCompressed ? 30 : 20));
                      }
                  }
              });

              ctx.shadowBlur = 0;
              ctx.restore(); // Restore Zoom/Pan
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
        className="w-full h-full bg-slate-950 cursor-move"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
};

export default BrainCanvas;
