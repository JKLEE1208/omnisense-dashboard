
import type { LidarPoint, RecordedFrame, IndexFile, UwbTag, MmWaveData, FrameData } from "../types";
import { MM_WAVE_BEAM_COUNT } from "../constants";

// Helper to get file from handle (supports nested paths)
async function getFileFromHandle(dirHandle: FileSystemDirectoryHandle, path: string): Promise<File | null> {
  try {
    const normalizedPath = path.replace(/\\/g, '/');
    const parts = normalizedPath.split('/');
    let currentHandle: any = dirHandle;
    for (let i = 0; i < parts.length - 1; i++) {
      currentHandle = await currentHandle.getDirectoryHandle(parts[i]);
    }
    const fileHandle = await currentHandle.getFileHandle(parts[parts.length - 1]);
    return await fileHandle.getFile();
  } catch (e) {
    return null;
  }
}

interface TimeIndexedFile {
  ts: number;
  handle: FileSystemFileHandle;
}

export class FilePlaybackService {
  private dirHandle: FileSystemDirectoryHandle | null = null;
  private frames: RecordedFrame[] = [];
  private currentIndex: number = 0;
  private uwbFiles: TimeIndexedFile[] = [];
  private mmWaveFiles: TimeIndexedFile[] = [];

  // Memory
  private lastUwbTag: UwbTag | null = null;
  private lastMmWave: MmWaveData | null = null;

  async loadDirectory(): Promise<boolean> {
    try {
      // @ts-ignore
      this.dirHandle = await window.showDirectoryPicker();
      if (!this.dirHandle) return false;

      // 1. Load index.json
      const indexFile = await getFileFromHandle(this.dirHandle!, "index.json");
      if (!indexFile) throw new Error("Missing index.json");

      const indexText = await indexFile.text();
      const indexData: IndexFile = JSON.parse(indexText);
      this.frames = indexData.frames.sort((a, b) => a.t_ns - b.t_ns);
      
      // 2. Scan for UWB and mmWave files
      // Priority: Check specific subdirectories 'uwb' and 'mmwave' first, then fallback to root.
      this.uwbFiles = [];
      this.mmWaveFiles = [];

      // Helper to scan a specific directory handle
      const scanDirectory = async (handle: FileSystemDirectoryHandle, type: 'uwb' | 'mmwave') => {
         // @ts-ignore
         for await (const entry of handle.values()) {
            if (entry.kind === 'file') {
               const fileHandle = entry as FileSystemFileHandle;
               if (type === 'uwb' && entry.name.startsWith('uwb_') && entry.name.endsWith('.csv')) {
                  const ts = this.parseTimestampFromFilename(entry.name, 'uwb_');
                  if (ts > 0) this.uwbFiles.push({ ts, handle: fileHandle });
               }
               else if (type === 'mmwave' && entry.name.startsWith('mmwave_') && entry.name.endsWith('.csv')) {
                  const ts = this.parseTimestampFromFilename(entry.name, 'mmwave_');
                  if (ts > 0) this.mmWaveFiles.push({ ts, handle: fileHandle });
               }
            }
         }
      };

      // Try 'uwb' subdirectory
      try {
         const uwbDir = await this.dirHandle.getDirectoryHandle('uwb');
         await scanDirectory(uwbDir, 'uwb');
      } catch(e) { 
         // Fallback to root if 'uwb' folder doesn't exist
         await scanDirectory(this.dirHandle, 'uwb');
      }

      // Try 'mmwave' subdirectory
      try {
         const mmDir = await this.dirHandle.getDirectoryHandle('mmwave');
         await scanDirectory(mmDir, 'mmwave');
      } catch(e) {
         // Fallback to root
         await scanDirectory(this.dirHandle, 'mmwave');
      }

      this.uwbFiles.sort((a, b) => a.ts - b.ts);
      this.mmWaveFiles.sort((a, b) => a.ts - b.ts);

      this.currentIndex = 0;
      this.lastUwbTag = null;
      this.lastMmWave = null;
      
      return true;
    } catch (e) {
      console.error("Load failed", e);
      alert("Error loading data: " + (e as Error).message);
      return false;
    }
  }

  private parseTimestampFromFilename(filename: string, prefix: string): number {
    try {
      // Format: uwb_20251122_034137_123.csv
      const raw = filename.replace(prefix, '').replace('.csv', ''); 
      const parts = raw.split('_'); 
      if (parts.length < 2) return 0;

      const dateStr = parts[0];
      const timePart = parts[1];
      let msStr = '000';
      if (parts.length >= 3) msStr = parts[2].substring(0, 3);
      else if (timePart.includes('.')) msStr = timePart.split('.')[1].substring(0, 3);

      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1;
      const day = parseInt(dateStr.substring(6, 8));
      const hour = parseInt(timePart.substring(0, 2));
      const min = parseInt(timePart.substring(2, 4));
      const sec = parseInt(timePart.substring(4, 6));
      const ms = parseInt(msStr);

      return new Date(year, month, day, hour, min, sec, ms).getTime();
    } catch (e) {
      return 0;
    }
  }

  getFrameCount(): number { return this.frames.length; }
  getCurrentIndex(): number { return this.currentIndex; }
  
  setIndex(idx: number) {
    this.currentIndex = Math.max(0, Math.min(idx, this.frames.length - 1));
    this.lastUwbTag = null; // Clear cache on seek
  }

  next(): boolean {
    if (this.currentIndex < this.frames.length - 1) {
      this.currentIndex++;
      return true;
    }
    return false;
  }

  private findClosestIndex(files: TimeIndexedFile[], targetTs: number): number {
    let low = 0, high = files.length - 1;
    let bestIdx = -1;
    let minDiff = Infinity;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const diff = Math.abs(files[mid].ts - targetTs);
      if (diff < minDiff) { minDiff = diff; bestIdx = mid; }
      if (files[mid].ts < targetTs) low = mid + 1;
      else high = mid - 1;
    }
    // Only accept if within 200ms
    return minDiff < 200 ? bestIdx : -1;
  }

  async getCurrentFrameData(): Promise<FrameData | null> {
    if (!this.dirHandle || this.frames.length === 0) return null;

    const frame = this.frames[this.currentIndex];
    const currentTsMs = frame.t_ns / 1_000_000;
    
    // Images
    let colorUrl = null, depthUrl = null;
    if (frame.streams.color) {
      const f = await getFileFromHandle(this.dirHandle, frame.streams.color);
      if (f) colorUrl = URL.createObjectURL(f);
    }
    if (frame.streams.depth_color) {
      const f = await getFileFromHandle(this.dirHandle, frame.streams.depth_color);
      if (f) depthUrl = URL.createObjectURL(f);
    }

    // LiDAR
    let lidarPoints: LidarPoint[] = [];
    if (frame.streams.lidar_rev) {
      const f = await getFileFromHandle(this.dirHandle, frame.streams.lidar_rev);
      if (f) {
        const text = await f.text();
        const lines = text.split('\n').slice(1);
        lines.forEach(line => {
          if (!line.trim()) return;
          const [angle, range, intensity, valid] = line.split(',').map(parseFloat);
          if (valid > 0.5 && range > 0.01) {
             // Rotate counter-clockwise by 90 degrees
             // 90 deg = PI/2
             // New Angle = Original + 90
             const rad = (angle + 90) * (Math.PI / 180);
             
             lidarPoints.push({
               x: range * Math.cos(rad),
               y: range * Math.sin(rad),
               intensity: intensity / 255.0
             });
          }
        });
      }
    }

    // UWB
    const uwbIdx = this.findClosestIndex(this.uwbFiles, currentTsMs);
    if (uwbIdx !== -1) {
      try {
        const f = await this.uwbFiles[uwbIdx].handle.getFile();
        const text = await f.text();
        const lines = text.split('\n');
        if (lines.length >= 2) {
           const row = lines[1].split(','); 
           // Parsing CSV: 9=x, 10=y, 11=z
           const x = parseFloat(row[9]), y = parseFloat(row[10]), z = parseFloat(row[11]);
           const dists = [4,5,6,7].map(i => parseFloat(row[i]) || 0);
           if (!isNaN(x)) {
             this.lastUwbTag = {
               id: "Tag" + (row[1] || '0'),
               position: { x, y, z },
               distances: dists
             };
           }
        }
      } catch (e) {}
    }

    // mmWave (Optional)
    const mmIdx = this.findClosestIndex(this.mmWaveFiles, currentTsMs);
    if (mmIdx !== -1) {
      try {
        const f = await this.mmWaveFiles[mmIdx].handle.getFile();
        const text = await f.text();
        const values = text.split(',').map(parseFloat);
        if (values.length >= MM_WAVE_BEAM_COUNT) {
          const power = values.slice(0, MM_WAVE_BEAM_COUNT);
          const maxVal = Math.max(...power);
          this.lastMmWave = { beamPower: power, peakIndex: power.indexOf(maxVal) };
        }
      } catch (e) {}
    }

    return {
      colorUrl, depthUrl, lidarPoints, uwbTag: this.lastUwbTag, mmWaveData: this.lastMmWave, timestamp: frame.t_ns
    };
  }
}

export const playbackService = new FilePlaybackService();
