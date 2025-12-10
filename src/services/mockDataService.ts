
import type { LidarPoint, MmWaveData, UwbTag, Point3D } from "../types";
import { UWB_ANCHORS, MM_WAVE_BEAM_COUNT } from "../constants";

// Helper for random gaussian
const gaussian = (mean: number, stdev: number) => {
  const u = 1 - Math.random(); 
  const v = Math.random();
  const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
  return z * stdev + mean;
};

// State for simulation continuity
let uwbTagPos: Point3D = { x: 0, y: 2, z: 0.5 };
let uwbAngle = 0;
let timeStep = 0;

export const generateLidarFrame = (count: number): LidarPoint[] => {
  const points: LidarPoint[] = [];
  
  // 1. Static walls (Box shape matching anchors roughly)
  const walls = [
    { x1: -4, y1: -1, x2: 3, y2: -1 },
    { x1: -4, y1: 10, x2: 3, y2: 10 },
    { x1: -4, y1: -1, x2: -4, y2: 10 },
    { x1: 3, y1: -1, x2: 3, y2: 10 },
  ];

  // Generate wall points with noise
  walls.forEach(w => {
    const steps = 100;
    for(let i=0; i<steps; i++) {
      const t = i/steps;
      points.push({
        x: w.x1 + (w.x2 - w.x1) * t + gaussian(0, 0.05),
        y: w.y1 + (w.y2 - w.y1) * t + gaussian(0, 0.05),
        intensity: Math.random()
      });
    }
  });

  // 2. Moving obstacle (representing a person)
  const obstacleX = Math.sin(timeStep * 0.05) * 2 - 1;
  const obstacleY = Math.cos(timeStep * 0.05) * 2 + 4;
  
  for(let i=0; i<30; i++) {
     const angle = (i / 30) * Math.PI * 2;
     const r = 0.3 + Math.random() * 0.05;
     points.push({
       x: obstacleX + Math.cos(angle) * r,
       y: obstacleY + Math.sin(angle) * r,
       intensity: 1.0
     });
  }

  return points;
};

export const generateUwbFrame = (): UwbTag => {
  // Move tag in a figure-8 pattern
  uwbAngle += 0.02;
  uwbTagPos.x = Math.sin(uwbAngle) * 2 - 1;
  uwbTagPos.y = Math.sin(uwbAngle * 2) * 2 + 4.5;
  uwbTagPos.z = 0.5 + Math.sin(uwbAngle * 5) * 0.1;

  // Calculate fake distances to anchors
  const distances = UWB_ANCHORS.map(anchor => {
    const dx = uwbTagPos.x - anchor.position.x;
    const dy = uwbTagPos.y - anchor.position.y;
    const dz = uwbTagPos.z - anchor.position.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz) + gaussian(0, 0.05);
  });

  return {
    id: "Tag1",
    position: { ...uwbTagPos },
    distances
  };
};

export const generateMmWaveFrame = (): MmWaveData => {
  timeStep++;
  const beamPower = new Array(MM_WAVE_BEAM_COUNT).fill(0);
  
  // Simulate a target moving across the beams
  const targetBeam = Math.floor((Math.sin(timeStep * 0.05) * 0.5 + 0.5) * (MM_WAVE_BEAM_COUNT - 1));
  
  for (let i = 0; i < MM_WAVE_BEAM_COUNT; i++) {
    // Gaussian distribution around target beam
    const dist = Math.abs(i - targetBeam);
    let power = Math.exp(-(dist * dist) / 20); // Width of beam
    
    // Add noise floor
    power += Math.random() * 0.1;
    
    // Static clutter removal simulation (dips in graph)
    if (i > 25 && i < 35) power *= 0.5;

    beamPower[i] = Math.min(Math.max(power, 0), 1);
  }

  return {
    beamPower,
    peakIndex: targetBeam
  };
};
