
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts';
import type { MmWaveData } from '../types';

interface MmWaveChartProps {
  data: MmWaveData;
}

export const MmWaveChart: React.FC<MmWaveChartProps> = ({ data }) => {
  const chartData = data.beamPower.map((power, idx) => ({
    beam: idx,
    power: power,
  }));

  return (
    <div className="w-full h-full p-4 bg-hud-black">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
          <defs>
             <linearGradient id="beamGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.3}/>
             </linearGradient>
          </defs>
          <XAxis 
            dataKey="beam" 
            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} 
            axisLine={{ stroke: '#3f3f46' }}
            tickLine={false}
            interval={7}
          />
          <YAxis 
            domain={[0, 1.1]} 
            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            cursor={{ fill: '#ffffff', opacity: 0.1 }}
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
            itemStyle={{ color: '#06b6d4', fontFamily: 'monospace' }}
            formatter={(value: number) => [value.toFixed(3), 'Power']}
            labelFormatter={(label) => `Beam Idx: ${label}`}
          />
          <Bar dataKey="power" fill="url(#beamGradient)" animationDuration={100}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={index === data.peakIndex ? '#f59e0b' : 'url(#beamGradient)'} 
                stroke={index === data.peakIndex ? '#f59e0b' : 'none'}
              />
            ))}
          </Bar>
          {/* Threshold Line */}
          <ReferenceLine y={0.8} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} label={{ position: 'right', value: 'TH', fill: '#ef4444', fontSize: 10 }} />
        </BarChart>
      </ResponsiveContainer>
      
      <div className="absolute top-4 right-6 flex flex-col items-end pointer-events-none">
        <div className="text-xs text-slate-400 font-mono mb-1">PEAK BEAM</div>
        <div className="text-2xl font-bold text-hud-accent font-mono">
          {data.peakIndex.toString().padStart(2, '0')}
        </div>
        <div className="text-[10px] text-slate-500 mt-1">
          PWR: {(data.beamPower[data.peakIndex] || 0).toFixed(2)}
        </div>
      </div>
    </div>
  );
};
