import React, { useEffect, useRef, useState } from 'react';
import { BioEngine } from '../services/BioEngine';
import { RegionType, BrainStats } from '../types';
import { COLORS, REGION_LAYOUT } from '../constants';

interface BrainCanvasProps {
  engine: BioEngine;
  onStatsUpdate: (stats: BrainStats) => void;
  renderEnabled: boolean;
}

const BrainCanvas: React.FC<BrainCanvasProps> = ({ engine, onStatsUpdate, renderEnabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle Resize
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
    handleResize(); // Init
    return () => window.removeEventListener('resize', handleResize);
  }, [engine]);

  // Main Render Loop
  useEffect(() => {
    let animationId: number;
    
    const render = () => {
      // 1. Logic Tick (Always runs)
      const stats = engine.tick();
      onStatsUpdate(stats);

      // 2. Draw Tick (Only if enabled)
      if (renderEnabled && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
              const width = canvasRef.current.width;
              const height = canvasRef.current.height;

              // Clear
              ctx.fillStyle = COLORS.BACKGROUND;
              ctx.fillRect(0, 0, width, height);

              // Draw Region Zones (Background)
              Object.values(REGION_LAYOUT).forEach(layout => {
                  const cx = layout.x * width;
                  const cy = layout.y * height;
                  ctx.beginPath();
                  ctx.arc(cx, cy, 100, 0, Math.PI * 2);
                  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                  ctx.fill();
                  
                  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                  ctx.font = '10px monospace';
                  ctx.textAlign = 'center';
                  ctx.fillText(layout.label, cx, cy - 110);
              });

              const now = Date.now();

              // Draw Synapses
              // Optimized: batch strokes? Hard with different colors.
              engine.neurons.forEach(neuron => {
                  neuron.connections.forEach(syn => {
                      const target = engine.neurons.find(n => n.id === syn.targetId);
                      if (!target) return;

                      ctx.beginPath();
                      ctx.moveTo(neuron.x, neuron.y);
                      ctx.lineTo(target.x, target.y);
                      
                      const isActive = (now - syn.lastActive) < 150;
                      ctx.lineWidth = Math.min(4, syn.weight * 0.5);
                      
                      if (isActive) {
                          ctx.strokeStyle = '#F59E0B'; // Spark color
                          ctx.lineWidth = 2;
                      } else {
                          ctx.strokeStyle = `rgba(100, 116, 139, ${Math.min(0.3, syn.weight * 0.1)})`;
                      }
                      ctx.stroke();
                  });
              });

              // Draw Neurons
              engine.neurons.forEach(neuron => {
                  const isFiring = neuron.potential > neuron.threshold;
                  
                  ctx.beginPath();
                  // Size depends on energy/potential
                  const r = 3 + (isFiring ? 2 : 0) + (neuron.stress / 50); 
                  ctx.arc(neuron.x, neuron.y, r, 0, Math.PI * 2);
                  
                  if (isFiring) {
                      ctx.fillStyle = '#ffffff';
                      ctx.shadowBlur = 10;
                      ctx.shadowColor = '#ffffff';
                  } else {
                      ctx.shadowBlur = 0;
                      if (neuron.region === RegionType.SensoryInput) ctx.fillStyle = '#ec4899';
                      else if (neuron.region === RegionType.VisualInput) ctx.fillStyle = '#eab308';
                      else if (neuron.region === RegionType.MotorOutput) ctx.fillStyle = '#22c55e';
                      else ctx.fillStyle = '#6366f1';
                  }
                  
                  ctx.fill();
              });
              ctx.shadowBlur = 0; // Reset
          }
      }

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [engine, renderEnabled, onStatsUpdate]);

  return (
    <div ref={containerRef} className="w-full h-full bg-black">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
};

export default BrainCanvas;