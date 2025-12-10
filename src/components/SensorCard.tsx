import React from 'react';
import { Maximize2, MoreHorizontal } from 'lucide-react';

interface SensorCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  status?: 'active' | 'inactive' | 'error';
}

export const SensorCard: React.FC<SensorCardProps> = ({ 
  title, 
  icon, 
  children, 
  className = "",
  status = 'active'
}) => {
  return (
    <div className={`flex flex-col bg-hud-panel border border-hud-border rounded-xl overflow-hidden shadow-lg backdrop-blur-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-hud-border bg-hud-dark/50">
        <div className="flex items-center gap-2">
          {icon && <span className="text-hud-primary">{icon}</span>}
          <h3 className="text-sm font-bold tracking-wider text-slate-200 uppercase">{title}</h3>
          
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 ml-3 px-2 py-0.5 rounded-full bg-slate-900/50 border border-slate-800">
            <div className={`w-1.5 h-1.5 rounded-full ${
              status === 'active' ? 'bg-hud-success shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
              status === 'error' ? 'bg-hud-danger' : 'bg-slate-500'
            }`} />
            <span className="text-[10px] font-mono text-slate-400">
              {status === 'active' ? 'LIVE' : status.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <Maximize2 size={16} />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {children}
      </div>
    </div>
  );
};