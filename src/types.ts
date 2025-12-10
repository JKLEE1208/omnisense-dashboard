// 1. 纯接口定义 (这些是允许的，因为它们会被"擦除")
export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface LidarPoint extends Point2D {
  intensity: number; // 0-255 or normalized 0-1
}

export interface UwbAnchor {
  id: string;
  position: Point3D;
  active: boolean;
}

export interface UwbTag {
  id: string;
  position: Point3D;
  distances: number[]; // Distances to anchors 0-3
}

export interface MmWaveData {
  beamPower: number[]; // Array of 64 normalized power values
  peakIndex: number;
}

// 🔴 修复点：将 enum 替换为 const 对象 + type
// 这样在运行时它是标准的 JS 对象，在编译时它是类型
export const SensorStatus = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  ACTIVE: 'ACTIVE',
  ERROR: 'ERROR',
  PLAYBACK: 'PLAYBACK'
} as const;

// 提取类型，这样你依然可以用 SensorStatus 作为类型注解
export type SensorStatus = typeof SensorStatus[keyof typeof SensorStatus];

export interface SystemState {
  fps: number;
  recording: boolean;
  recordingTime: number;
  cpuUsage: number;
}

// Playback Specific Types
export interface RecordedFrame {
  idx: number;
  t_ns: number;
  streams: {
    color?: string;
    depth_color?: string;
    lidar_rev?: string;
  };
  lidar_rev_t_ns?: number;
}

export interface IndexFile {
  version: number;
  frames: RecordedFrame[];
}

export interface FrameData {
  colorUrl: string | null;
  depthUrl: string | null;
  lidarPoints: LidarPoint[];
  uwbTag: UwbTag | null;
  mmWaveData: MmWaveData | null;
  timestamp: number;
}