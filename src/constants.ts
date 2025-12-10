import type { UwbAnchor } from "./types";

// UWB Anchor Configuration (Matching your Python script)
export const UWB_ANCHORS: UwbAnchor[] = [
  { id: 'A0', position: { x: 0.0, y: 0.0, z: 1.2 }, active: true },
  { id: 'A1', position: { x: 1.4, y: 9.6, z: 1.6 }, active: true },
  { id: 'A2', position: { x: -2.7, y: 0.0, z: 0.8 }, active: true },
  { id: 'A3', position: { x: -2.7, y: 4.5, z: 0.0 }, active: true },
];

export const LIDAR_MAX_RANGE_M = 12;

export const COLORS = {
  lidarPoint: '#22c55e',
  lidarTrail: '#15803d',
  uwbAnchor: '#06b6d4',
  uwbTag: '#ef4444',
  grid: '#3f3f46',
  background: '#0a0a0b'
};

export const MM_WAVE_BEAM_COUNT = 64;

export const TRANSLATIONS = {
  en: {
    liveMode: 'LIVE MONITOR',
    playbackMode: 'DATA PLAYBACK',
    loadData: 'LOAD DATA',
    rec: 'REC',
    waiting: 'WAITING FOR STREAM...',
    playbackLoaded: 'DATA LOADED',
    frames: 'FRAMES',
    systemLog: 'SYSTEM LOG',
    lidarFusion: 'LIDAR + UWB FUSION',
    mmwave: 'mmWAVE BEAMFORMING',
    rgb: 'RGB CAMERA',
    depth: 'DEPTH SENSOR',
    tagPos: 'TAG POSITION',
    anchors: 'ANCHOR SIGNAL',
    systemReady: 'System ready. Select mode.',
    mockData: 'Generating simulation data...',
    loading: 'Loading directory...',
    play: 'PLAY',
    pause: 'PAUSE',
  },
  zh: {
    liveMode: '实时采集',
    playbackMode: '数据回放',
    loadData: '加载数据',
    rec: '录制',
    waiting: '等待传感器流...',
    playbackLoaded: '数据已加载',
    frames: '帧数',
    systemLog: '系统日志',
    lidarFusion: '激光雷达 + UWB 融合',
    mmwave: '毫米波波束',
    rgb: 'RGB摄像头',
    depth: '深度相机',
    tagPos: '标签位置',
    anchors: '基站信号',
    systemReady: '系统就绪，请选择模式。',
    mockData: '正在生成模拟测试数据...',
    loading: '正在读取目录...',
    play: '播放',
    pause: '暂停',
  }
};