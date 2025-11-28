import React, { useEffect, useRef, useState } from 'react';
import { BioEngine } from '../services/BioEngine';
import { Neuron, RegionType, BrainStats } from '../types';
import { COLORS, REGION_LAYOUT, PHYSICS } from '../constants';

interface BrainCanvasProps {
  inputSignal: string | null;
  onStatsUpdate: (stats: BrainStats) => void;
  saveTrigger: number; // Increment to trigger save
  loadTrigger: number; // Increment to trigger load
}

const BrainCanvas: React.FC<BrainCanvasProps> = ({ inputSignal, onStatsUpdate, saveTrigger, loadTrigger }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const engineRef = useRef<BioEngine | null>(null);
  const [neurons, setNeurons] = useState<Neuron[]>([]);
  const animationRef = useRef<number>(0);

  // Initialize Engine
  useEffect(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    
    if (!engineRef.current) {
        engineRef.current = new BioEngine(clientWidth, clientHeight);
    }
  }, []);

  // Handle Input
  useEffect(() => {
      if (inputSignal && engineRef.current) {
          engineRef.current.processInput(inputSignal);
      }
  }, [inputSignal]);

  // Handle Save
  useEffect(() => {
      if (saveTrigger > 0 && engineRef.current) {
          const data = JSON.stringify(engineRef.current.neurons);
          localStorage.setItem('bio_brain_v1', data);
          console.log("Brain saved to LocalStorage");
      }
  }, [saveTrigger]);

  // Handle Load
  useEffect(() => {
      if (loadTrigger > 0 && engineRef.current) {
          const data = localStorage.getItem('bio_brain_v1');
          if (data) {
              const parsed = JSON.parse(data);
              engineRef.current.loadState(parsed);
              console.log("Brain loaded from LocalStorage");
          }
      }
  }, [loadTrigger]);

  // Main Loop
  useEffect(() => {
    const loop = () => {
      if (engineRef.current) {
        const stats = engineRef.current.tick();
        setNeurons([...engineRef.current.neurons]); 
        onStatsUpdate(stats);
      }
      animationRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationRef.current);
  }, [onStatsUpdate]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!engineRef.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    engineRef.current.stimulateArea(x, y);
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-950 overflow-hidden relative select-none">
      <svg 
        ref={svgRef} 
        width="100%" 
        height="100%" 
        onClick={handleCanvasClick}
        className="cursor-crosshair"
      >
        <defs>
          <filter id="glow-intense">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Region Zones */}
        {Object.entries(REGION_LAYOUT).map(([key, layout]) => {
           const cx = layout.x * (containerRef.current?.clientWidth || 1000);
           const cy = layout.y * (containerRef.current?.clientHeight || 800);
           let color = COLORS.REGION_ASSOCIATION;
           if (key === RegionType.SensoryInput) color = COLORS.REGION_SENSORY;
           if (key === RegionType.MotorOutput) color = COLORS.REGION_MOTOR;

           return (
             <g key={key}>
               <circle cx={cx} cy={cy} r="150" fill={color} filter="blur(60px)" opacity="0.4" />
               <text x={cx} y={cy - 120} textAnchor="middle" fill={color.replace('0.1', '0.8')} className="text-xs font-bold font-mono tracking-widest pointer-events-none opacity-50">
                  {layout.label}
               </text>
             </g>
           );
        })}

        {/* Connections */}
        {neurons.map((neuron) => (
          <g key={`synapses-${neuron.id}`}>
            {neuron.connections.map((synapse) => {
              const target = neurons.find(n => n.id === synapse.targetId);
              if (!target) return null;
              
              const now = Date.now();
              const justFired = (now - synapse.lastActive) < 100;
              
              // Thickness based on weight
              const width = Math.max(0.5, synapse.weight * 1.5);
              
              // Color based on strength and recent activity
              let stroke = '#334155'; // Dark slate default
              if (justFired) stroke = '#fbbf24'; // Gold flash
              else if (synapse.weight > 2.0) stroke = '#10b981'; // Strong connection (Green)

              return (
                <line
                  key={`${neuron.id}-${target.id}`}
                  x1={neuron.x}
                  y1={neuron.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={stroke}
                  strokeWidth={width}
                  opacity={justFired ? 1 : 0.4}
                />
              );
            })}
          </g>
        ))}

        {/* Neurons */}
        {neurons.map((neuron) => {
          // Display logic
          const isFiring = neuron.potential > 20; // Visual threshold
          const displayRadius = 3 + (neuron.energy * 3) + (neuron.potential / 10);
          
          let fill = '#475569';
          if (neuron.region === RegionType.SensoryInput) fill = '#ec4899';
          if (neuron.region === RegionType.Association) fill = '#6366f1';
          if (neuron.region === RegionType.MotorOutput) fill = '#22c55e';

          // Stress indication
          if (neuron.stress > 20) fill = '#ef4444'; 

          return (
            <g key={neuron.id} style={{ transition: 'all 0.1s ease' }}>
                <circle
                cx={neuron.x}
                cy={neuron.y}
                r={displayRadius}
                fill={isFiring ? '#ffffff' : fill}
                filter={isFiring ? "url(#glow-intense)" : ""}
                opacity={isFiring ? 1 : 0.8}
                />
                {/* Age Ring */}
                <circle
                    cx={neuron.x}
                    cy={neuron.y}
                    r={displayRadius + 2}
                    fill="none"
                    stroke={fill}
                    strokeWidth="1"
                    opacity="0.3"
                />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default BrainCanvas;