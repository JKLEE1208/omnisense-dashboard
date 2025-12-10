
import React from 'react';

interface VideoFeedProps {
  type: 'rgb' | 'depth';
  fps?: number;
  resolution?: string;
  isRecording?: boolean;
  srcOverride?: string | null;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({ 
  type, 
  fps = 0, 
  resolution = "640x480", 
  isRecording = false,
  srcOverride = null
}) => {
  // If we have a source (from playback), use it. Otherwise, we have no signal.
  const hasSignal = !!srcOverride;
  const src = srcOverride || '';

  const imgStyle: React.CSSProperties = (type === 'depth' && hasSignal)
    ? {} 
    : {};

  return (
    <div className="w-full h-full relative bg-black group overflow-hidden border border-hud-border/30 rounded-lg">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-20" style={{ 
          backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', 
          backgroundSize: '20px 20px' 
        }}>
      </div>

      {hasSignal ? (
        <img 
          src={src} 
          alt={type} 
          className="w-full h-full object-contain bg-black/50"
          style={imgStyle}
        />
      ) : (
        /* NO SIGNAL Screen */
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative">
            <div className="text-4xl font-black text-slate-800 tracking-widest font-mono select-none animate-pulse">
              NO SIGNAL
            </div>
            {/* Glitch effect overlay */}
            <div className="absolute inset-0 text-4xl font-black text-hud-danger/20 tracking-widest font-mono select-none translate-x-[2px] animate-pulse">
              NO SIGNAL
            </div>
          </div>
          <div className="mt-4 flex flex-col items-center gap-1">
             <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-hud-danger/50 w-1/2 animate-[shimmer_2s_infinite]"></div>
             </div>
             <span className="text-[10px] text-slate-600 font-mono">WAITING FOR SOURCE...</span>
          </div>
        </div>
      )}
      
      {/* HUD Overlay */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
        
        {/* Top Bar */}
        <div className="flex justify-between items-start">
           <div className={`px-2 py-1 rounded border-l-2 backdrop-blur-sm transition-colors ${hasSignal ? 'bg-black/60 border-hud-primary' : 'bg-red-900/20 border-red-900'}`}>
             <div className="text-[10px] text-slate-400 font-mono uppercase">Source ID</div>
             <div className={`text-xs font-bold font-mono ${hasSignal ? 'text-white' : 'text-red-700'}`}>
               {type === 'rgb' ? 'CAM_01_RGB' : 'CAM_01_DEPTH'}
             </div>
           </div>
           
           {isRecording && (
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
               <span className="text-xs font-mono text-red-500 font-bold">REC</span>
             </div>
           )}
        </div>

        {/* Center Crosshair (Visible only if signal) */}
        {hasSignal && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
            <svg width="40" height="40" viewBox="0 0 40 40">
              <line x1="20" y1="10" x2="20" y2="30" stroke="white" strokeWidth="1" />
              <line x1="10" y1="20" x2="30" y2="20" stroke="white" strokeWidth="1" />
              <circle cx="20" cy="20" r="15" stroke="white" strokeWidth="1" fill="none" />
            </svg>
          </div>
        )}

        {/* Bottom Info */}
        <div className="flex justify-between items-end">
          <div className="font-mono text-[10px] text-hud-primary/80">
            <div>RES: {resolution}</div>
            <div>FMT: {type === 'rgb' ? 'RAW8' : 'Z16'}</div>
          </div>
          <div className="font-mono text-xs text-white">
            <span className="text-slate-400 text-[10px]">FPS:</span> {hasSignal ? fps : 0}
          </div>
        </div>
      </div>
      
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_4px,3px_100%] opacity-50"></div>
    </div>
  );
};
