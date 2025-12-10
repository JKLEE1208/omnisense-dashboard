
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { LidarPoint, UwbAnchor, UwbTag } from '../types';
import { LIDAR_MAX_RANGE_M, UWB_ANCHORS, COLORS } from '../constants';

interface LidarFusionMapProps {
  lidarPoints: LidarPoint[];
  uwbTag: UwbTag | null;
}

export const LidarFusionMap: React.FC<LidarFusionMapProps> = ({ lidarPoints, uwbTag }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    // Define the world view window in meters
    // X: -6m to +6m (12m total width)
    // Y: -2m to +10m (12m total height) - shifted to show room better
    const VIEW_WIDTH_M = LIDAR_MAX_RANGE_M; 
    const VIEW_HEIGHT_M = LIDAR_MAX_RANGE_M;
    const Y_OFFSET_M = 4; // Center Y at 4m (so range is -2 to 10)

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const availableWidth = containerWidth - margin.left - margin.right;
    const availableHeight = containerHeight - margin.top - margin.bottom;

    // Calculate Pixels Per Meter (PPM) to enforce 1:1 aspect ratio
    // We take the smaller dimension to ensure the whole 12x12m area fits
    const ppm = Math.min(availableWidth / VIEW_WIDTH_M, availableHeight / VIEW_HEIGHT_M);

    // Calculate the actual centered drawing area
    const drawingWidth = VIEW_WIDTH_M * ppm;
    const drawingHeight = VIEW_HEIGHT_M * ppm;
    const startX = margin.left + (availableWidth - drawingWidth) / 2;
    const startY = margin.top + (availableHeight - drawingHeight) / 2;

    const xScale = d3.scaleLinear()
      .domain([-VIEW_WIDTH_M / 2, VIEW_WIDTH_M / 2])
      .range([startX, startX + drawingWidth]);

    // Invert Y axis (SVG 0 is top), map -2 to 10
    const yScale = d3.scaleLinear()
      .domain([-2, 10]) 
      .range([startY + drawingHeight, startY]);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    // 1. Draw Grid
    const xTicks = xScale.ticks(10);
    const yTicks = yScale.ticks(10);

    // Grid Lines X
    svg.selectAll(".grid-x")
      .data(xTicks)
      .enter().append("line")
      .attr("class", "grid-x")
      .attr("x1", d => xScale(d))
      .attr("y1", yScale(-2))
      .attr("x2", d => xScale(d))
      .attr("y2", yScale(10))
      .attr("stroke", COLORS.grid)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,4")
      .attr("opacity", 0.3);

    // Grid Lines Y
    svg.selectAll(".grid-y")
      .data(yTicks)
      .enter().append("line")
      .attr("class", "grid-y")
      .attr("x1", xScale(-VIEW_WIDTH_M / 2))
      .attr("y1", d => yScale(d))
      .attr("x2", xScale(VIEW_WIDTH_M / 2))
      .attr("y2", d => yScale(d))
      .attr("stroke", COLORS.grid)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,4")
      .attr("opacity", 0.3);
      
    // Origin Crosshair (0,0)
    svg.append("line")
      .attr("x1", xScale(-0.5)).attr("y1", yScale(0))
      .attr("x2", xScale(0.5)).attr("y2", yScale(0))
      .attr("stroke", "#fff").attr("stroke-width", 2);
    svg.append("line")
      .attr("x1", xScale(0)).attr("y1", yScale(-0.5))
      .attr("x2", xScale(0)).attr("y2", yScale(0.5))
      .attr("stroke", "#fff").attr("stroke-width", 2);

    // 2. Draw Range Rings (Radar style)
    // Draw perfect circles now that scaling is 1:1
    [2, 4, 6, 8, 10].forEach(r => {
        const radiusPx = r * ppm;
        
        svg.append("circle")
           .attr("cx", xScale(0))
           .attr("cy", yScale(0))
           .attr("r", radiusPx)
           .attr("fill", "none")
           .attr("stroke", COLORS.grid)
           .attr("stroke-opacity", 0.5);
           
        svg.append("text")
           .attr("x", xScale(0) + 5)
           .attr("y", yScale(r) - 5)
           .text(`${r}m`)
           .attr("fill", COLORS.grid)
           .attr("font-size", "10px")
           .attr("font-family", "monospace");
    });

    // 3. Draw LiDAR Points
    svg.selectAll(".lidar-pt")
      .data(lidarPoints)
      .enter().append("circle")
      .attr("class", "lidar-pt")
      .attr("cx", d => xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", 2)
      .attr("fill", COLORS.lidarPoint)
      .attr("opacity", d => 0.4 + (d.intensity * 0.6));

    // 4. Draw UWB Anchors
    const anchorGroup = svg.selectAll(".anchor")
      .data(UWB_ANCHORS)
      .enter().append("g")
      .attr("transform", (d: UwbAnchor) => `translate(${xScale(d.position.x)}, ${yScale(d.position.y)})`);

    // Anchor Triangle Symbol
    anchorGroup.append("path")
      .attr("d", d3.symbol().type(d3.symbolTriangle).size(150))
      .attr("fill", COLORS.uwbAnchor);

    // Anchor Label
    anchorGroup.append("text")
      .text((d: UwbAnchor) => d.id)
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .attr("fill", COLORS.uwbAnchor)
      .attr("font-size", "12px")
      .attr("font-weight", "bold");

    // 5. Draw UWB Tag
    if (uwbTag) {
      const tagG = svg.append("g")
        .attr("transform", `translate(${xScale(uwbTag.position.x)}, ${yScale(uwbTag.position.y)})`);
        
      // Pulse effect
      tagG.append("circle")
        .attr("r", 20)
        .attr("fill", COLORS.uwbTag)
        .attr("opacity", 0.2)
        .append("animate")
        .attr("attributeName", "r")
        .attr("from", "5")
        .attr("to", "30")
        .attr("dur", "1.5s")
        .attr("repeatCount", "indefinite");

      tagG.append("circle")
        .attr("r", 30)
        .attr("fill", COLORS.uwbTag)
        .attr("opacity", 0.1)
        .append("animate")
        .attr("attributeName", "opacity")
        .attr("values", "0.3;0;0.3")
        .attr("dur", "1.5s")
        .attr("repeatCount", "indefinite");

      // Actual tag dot
      tagG.append("circle")
        .attr("r", 6)
        .attr("fill", COLORS.uwbTag)
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);

      // Coordinates text
      tagG.append("text")
        .text(`TAG: [${uwbTag.position.x.toFixed(2)}, ${uwbTag.position.y.toFixed(2)}]`)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("fill", "#fff")
        .attr("font-size", "11px")
        .attr("font-family", "monospace")
        .attr("class", "drop-shadow-md");
        
      // Draw lines to anchors
      UWB_ANCHORS.forEach((anchor) => {
          svg.append("line")
             .attr("x1", xScale(uwbTag.position.x))
             .attr("y1", yScale(uwbTag.position.y))
             .attr("x2", xScale(anchor.position.x))
             .attr("y2", yScale(anchor.position.y))
             .attr("stroke", COLORS.uwbAnchor)
             .attr("stroke-width", 1)
             .attr("stroke-dasharray", "2,2")
             .attr("opacity", 0.3);
      });
    }

  }, [lidarPoints, uwbTag]); // Re-render when data changes

  return (
    <div ref={containerRef} className="w-full h-full relative bg-hud-black">
      <svg ref={svgRef} className="w-full h-full block" />
      {/* Radar Sweep overlay - centered on 0,0 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         {/* Note: This CSS animation is just visual candy, it might not align perfectly with 0,0 if the view is shifted. 
             Ideally we would move this div to match xScale(0), yScale(0) but CSS-only is static.
             For now, we keep it centered in the div or remove it if it's distracting. */}
      </div>
      <div className="absolute bottom-2 right-2 text-[10px] text-slate-500 font-mono">
        SCALE: 10m (1:1) | GRID: 2m
      </div>
    </div>
  );
};
