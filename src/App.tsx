
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Activity, Video, Zap, Cpu, Settings, PlayCircle, StopCircle, Eye, Radio, FolderOpen, Pause, Globe } from 'lucide-react';
import { SensorCard } from './components/SensorCard';
import { LidarFusionMap } from './components/LidarFusionMap';
import { MmWaveChart } from './components/MmWaveChart';
import { VideoFeed } from './components/VideoFeed';
import { OmniLogo } from './components/OmniLogo';
import { generateLidarFrame, generateMmWaveFrame, generateUwbFrame } from './services/mockDataService';
import { playbackService } from './services/filePlaybackService';
import type { LidarPoint, MmWaveData, UwbTag } from './types';
import { TRANSLATIONS } from './constants';

const App = () => {
  const [lang, setLang] = useState<'en' | 'zh'>('zh');
  const t = TRANSLATIONS[lang];
  
  const [mode, setMode] = useState<'live' | 'playback'>('live');
  const [lidarData, setLidarData] = useState<LidarPoint[]>([]);
  const [mmWaveData, setMmWaveData] = useState<MmWaveData>({ beamPower: new Array(64).fill(0), peakIndex: 0 });
  const [uwbTag, setUwbTag] = useState<UwbTag | null>(null);
  
  const [playbackImages, setPlaybackImages] = useState<{rgb: string | null, depth: string | null}>({ rgb: null, depth: null });
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [recording, setRecording] = useState(false);
  const [fps, setFps] = useState(0);
  const [frameTime, setFrameTime] = useState(0);
  
  const lastUrlRef = useRef<{rgb: string | null, depth: string | null}>({ rgb: null, depth: null });

  const cleanupUrls = () => {
    if (lastUrlRef.current.rgb) URL.revokeObjectURL(lastUrlRef.current.rgb);
    if (lastUrlRef.current.depth) URL.revokeObjectURL(lastUrlRef.current.depth);
  };

  const updateSensorsLive = useCallback(() => {
    const start = performance.now();
    setLidarData(generateLidarFrame(500));
    setMmWaveData(generateMmWaveFrame());
    setUwbTag(generateUwbFrame());
    const end = performance.now();
    setFrameTime(end - start);
    setFps(Math.round(1000 / Math.max(end - start, 16)));
  }, []);

  const updateSensorsPlayback = useCallback(async () => {
    if (!isPlaying) return;
    const start = performance.now();
    const hasNext = playbackService.next();
    
    if (hasNext) {
      const data = await playbackService.getCurrentFrameData();
      if (data) {
        cleanupUrls();
        lastUrlRef.current = { rgb: data.colorUrl, depth: data.depthUrl };
        setPlaybackImages({ rgb: data.colorUrl, depth: data.depthUrl });
        setLidarData(data.lidarPoints);
        setPlaybackProgress(playbackService.getCurrentIndex());
        if (data.uwbTag) setUwbTag(data.uwbTag);
        if (data.mmWaveData) setMmWaveData(data.mmWaveData);
      }
    } else {
      setIsPlaying(false);
    }
    const end = performance.now();
    setFrameTime(end - start);
    setFps(Math.round(1000 / Math.max(end - start, 16)));
  }, [isPlaying]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (mode === 'live') {
      interval = setInterval(updateSensorsLive, 33);
    } else {
      interval = setInterval(updateSensorsPlayback, 33);
    }
    return () => clearInterval(interval);
  }, [mode, isPlaying, updateSensorsLive, updateSensorsPlayback]);

  const handleOpenFolder = async () => {
    const success = await playbackService.loadDirectory();
    if (success) {
      setMode('playback');
      setTotalFrames(playbackService.getFrameCount());
      setIsPlaying(true);
      const data = await playbackService.getCurrentFrameData();
      if (data) {
        setPlaybackImages({ rgb: data.colorUrl, depth: data.depthUrl });
        setLidarData(data.lidarPoints);
        if (data.uwbTag) setUwbTag(data.uwbTag);
      }
    }
  };

  const handleSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = parseInt(e.target.value);
    playbackService.setIndex(idx);
    setPlaybackProgress(idx);
    const data = await playbackService.getCurrentFrameData();
    if (data) {
      cleanupUrls();
      lastUrlRef.current = { rgb: data.colorUrl, depth: data.depthUrl };
      setPlaybackImages({ rgb: data.colorUrl, depth: data.depthUrl });
      setLidarData(data.lidarPoints);
      if (data.uwbTag) setUwbTag(data.uwbTag);
    }
  };

  return (
    <div className="min-h-screen bg-hud-black text-slate-300 font-sans flex flex-col">
      <header className="h-16 shrink-0 border-b border-hud-border bg-hud-dark/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <OmniLogo className="w-8 h-8" />
            <h1 className="text-xl font-bold tracking-tight text-white font-mono hidden md:block">
              OMNI<span className="text-hud-primary">SENSE</span>
            </h1>
          </div>
          
          <div className="h-6 w-px bg-slate-700 mx-4 hidden md:block"></div>
          
          {/* Mode Switcher */}
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
             <button 
               onClick={() => { setMode('live'); setIsPlaying(false); }}
               className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'live' ? 'bg-hud-primary text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
             >
               {t.liveMode}
             </button>
             <button 
               onClick={() => setMode('playback')}
               className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'playback' ? 'bg-hud-primary text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
             >
               {t.playbackMode}
             </button>
          </div>
        </div>

        {/* Playback Controls (Center) */}
        {mode === 'playback' && (
           <div className="flex items-center gap-3 bg-slate-900/50 rounded-lg px-3 py-1 border border-slate-800 absolute left-1/2 -translate-x-1/2 hidden md:flex">
              <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-white text-hud-primary transition-colors">
                {isPlaying ? <Pause size={18} /> : <PlayCircle size={18} />}
              </button>
              <input 
                type="range" min="0" max={Math.max(0, totalFrames - 1)} 
                value={playbackProgress} onChange={handleSeek}
                className="w-32 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-hud-primary"
              />
              <span className="text-[10px] font-mono text-slate-400 w-12 text-right">{playbackProgress}/{totalFrames}</span>
           </div>
        )}

        {/* Right Tools */}
        <div className="flex items-center gap-4 font-mono text-xs">
          {mode === 'playback' && (
            <button 
              onClick={handleOpenFolder}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors"
            >
              <FolderOpen size={16} />
              <span className="hidden sm:inline">{t.loadData}</span>
            </button>
          )}

          {mode === 'live' && (
            <button 
              onClick={() => setRecording(!recording)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all duration-300 ${
                recording ? 'bg-red-500/10 border-red-500 text-red-500 animate-pulse' : 'bg-slate-800 border-slate-700'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${recording ? 'bg-red-500' : 'bg-slate-500'}`} />
              <span>{t.rec}</span>
            </button>
          )}

          <div className="h-6 w-px bg-slate-700 hidden sm:block"></div>
          
          <button onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
             <Globe size={14} />
             <span>{lang.toUpperCase()}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-3 flex flex-col gap-3 lg:grid lg:grid-cols-12 lg:h-[calc(100vh-64px)] overflow-hidden">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-3 h-full min-h-0">
          <div className="grid grid-cols-2 gap-3 h-[250px] lg:h-[40%] shrink-0">
            <SensorCard title={t.rgb} icon={<Video size={16} />} status="active" className="h-full">
              <VideoFeed type="rgb" fps={fps} isRecording={recording} srcOverride={playbackImages.rgb} />
            </SensorCard>
            <SensorCard title={t.depth} icon={<Eye size={16} />} status="active" className="h-full">
              <VideoFeed type="depth" fps={fps} isRecording={recording} srcOverride={playbackImages.depth} />
            </SensorCard>
          </div>
          <div className="h-[400px] lg:h-auto lg:flex-1 min-h-0">
             <SensorCard title={t.lidarFusion} icon={<Radio size={16} />} className="h-full">
                <div className="absolute inset-0 flex flex-col md:flex-row">
                  <div className="flex-grow h-full border-b md:border-b-0 md:border-r border-hud-border relative">
                    <LidarFusionMap lidarPoints={lidarData} uwbTag={uwbTag} />
                  </div>
                  <div className="w-full md:w-56 bg-hud-dark/50 p-3 font-mono text-xs flex flex-col gap-3 shrink-0 overflow-y-auto">
                     <div>
                        <h4 className="text-slate-500 mb-2">{t.tagPos}</h4>
                        <div className="space-y-1">
                           <div className="flex justify-between border-b border-white/5 pb-1"><span>X</span><span className="text-hud-primary">{(uwbTag?.position.x || 0).toFixed(2)}m</span></div>
                           <div className="flex justify-between border-b border-white/5 pb-1"><span>Y</span><span className="text-hud-primary">{(uwbTag?.position.y || 0).toFixed(2)}m</span></div>
                           <div className="flex justify-between"><span>Z</span><span className="text-hud-primary">{(uwbTag?.position.z || 0).toFixed(2)}m</span></div>
                        </div>
                     </div>
                  </div>
                </div>
             </SensorCard>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3 h-full min-h-0">
           <div className="h-[250px] lg:h-[50%] shrink-0">
             <SensorCard title={t.mmwave} icon={<Activity size={16} />} className="h-full">
               <MmWaveChart data={mmWaveData} />
             </SensorCard>
           </div>
           <div className="h-[200px] lg:h-auto lg:flex-1 min-h-0">
              <SensorCard title={t.systemLog} icon={<Settings size={16} />} className="h-full">
                <div className="h-full bg-black/40 p-3 font-mono text-[10px] leading-relaxed text-slate-400 overflow-y-auto">
                  <div className="text-hud-success">&gt;&gt; {t.systemReady}</div>
                  {mode === 'live' ? <div>&gt;&gt; {t.mockData}</div> : <div>&gt;&gt; {t.waiting}</div>}
                  {uwbTag && <div>[UWB] Tag detected at [{uwbTag.position.x.toFixed(1)}, {uwbTag.position.y.toFixed(1)}]</div>}
                  <div className="mt-2 text-slate-600 border-t border-slate-800 pt-2">FPS: {fps} | Latency: {frameTime.toFixed(1)}ms</div>
                </div>
              </SensorCard>
           </div>
        </div>
      </main>
    </div>
  );
};
export default App;
