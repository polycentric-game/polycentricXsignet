'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useRouter } from 'next/navigation';
import { Founder, Agreement, GraphNode, GraphEdge } from '@/lib/types';
import { getAgreementDisplayNumber } from '@/lib/utils';

interface FounderGraphProps {
  founder: Founder;
  founders: Founder[];
  agreements: Agreement[];
  className?: string;
}

export function FounderGraph({ 
  founder, 
  founders, 
  agreements, 
  className = '' 
}: FounderGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const router = useRouter();
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });
  
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const container = svgRef.current.parentElement;
        if (container) {
          setDimensions({
            width: container.clientWidth,
            height: Math.max(300, container.clientHeight),
          });
        }
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const { width, height } = dimensions;
    
    // Get agreements involving this founder
    const founderAgreements = agreements.filter(
      a => a.founderAId === founder.id || a.founderBId === founder.id
    );
    
    // Get connected founders
    const connectedFounderIds = new Set<string>();
    founderAgreements.forEach(agreement => {
      if (agreement.founderAId === founder.id) {
        connectedFounderIds.add(agreement.founderBId);
      } else {
        connectedFounderIds.add(agreement.founderAId);
      }
    });
    
    const connectedFounders = founders.filter(f => connectedFounderIds.has(f.id));
    
    // Create nodes (center founder + connected founders)
    const nodes: GraphNode[] = [
      {
        id: founder.id,
        founderName: founder.founderName,
        companyName: founder.companyName,
        x: width / 2,
        y: height / 2,
      },
      ...connectedFounders.map((f, index) => {
        const angle = (index / connectedFounders.length) * 2 * Math.PI;
        const radius = Math.min(width, height) * 0.3;
        return {
          id: f.id,
          founderName: f.founderName,
          companyName: f.companyName,
          x: width / 2 + Math.cos(angle) * radius,
          y: height / 2 + Math.sin(angle) * radius,
        };
      })
    ];
    
    // Create edges
    const edges: GraphEdge[] = founderAgreements.map(agreement => ({
      id: agreement.id,
      source: agreement.founderAId,
      target: agreement.founderBId,
      status: agreement.status,
    }));
    
    if (nodes.length === 1) {
      // Show message if no connections
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'currentColor')
        .attr('font-size', '14px')
        .text('No agreements yet');
      return;
    }
    
    // Create force simulation (lighter forces for mini graph)
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id((d: any) => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(25));
    
    // Create main group
    const g = svg.append('g');
    
    // Create edges
    const link = g.append('g')
      .selectAll('line')
      .data(edges)
      .enter().append('line')
      .attr('stroke-width', 2)
      .attr('stroke', d => {
        switch (d.status) {
          case 'proposed': return '#3B82F6';
          case 'revised': return '#EAB308';
          case 'approved': return '#39FF14';
          case 'completed': return '#10B981';
          default: return '#6B7280';
        }
      })
      .attr('stroke-opacity', 0.7)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        router.push(`/agreement/${d.id}`);
      });
    
    // Create nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', d => d.id === founder.id ? 20 : 15)
      .attr('fill', d => {
        const nodeFounder = founders.find(f => f.id === d.id);
        if (!nodeFounder) return '#6B7280';
        
        if (d.id === founder.id) {
          return '#39FF14'; // Highlight center founder
        }
        
        const remaining = nodeFounder.totalEquityAvailable - nodeFounder.equitySwapped;
        const percentage = remaining / nodeFounder.totalEquityAvailable;
        
        if (percentage > 0.7) return '#10B981'; // Green
        if (percentage > 0.3) return '#EAB308'; // Yellow
        return '#EF4444'; // Red
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', d => d.id === founder.id ? 3 : 2)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        if (d.id !== founder.id) {
          router.push(`/founder/${d.id}`);
        }
      });
    
    // Create labels
    const label = g.append('g')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('fill', '#fff')
      .attr('font-size', d => d.id === founder.id ? '11px' : '9px')
      .attr('font-weight', '500')
      .style('pointer-events', 'none')
      .text(d => d.founderName.split(' ')[0]); // First name only
    
    // Create clickable agreement labels on edges
    const edgeLabels = g.append('g')
      .selectAll('g')
      .data(edges)
      .enter().append('g')
      .attr('class', 'edge-label-group')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        router.push(`/agreement/${d.id}`);
      });
    
    // Add transparent background rectangles for better clickability
    edgeLabels.append('rect')
      .attr('width', 32)
      .attr('height', 14)
      .attr('x', -16)
      .attr('y', -7)
      .attr('fill', 'rgba(255, 255, 255, 0.8)')
      .attr('stroke', d => {
        switch (d.status) {
          case 'proposed': return '#3B82F6';
          case 'revised': return '#EAB308';
          case 'approved': return '#39FF14';
          case 'completed': return '#10B981';
          default: return '#6B7280';
        }
      })
      .attr('stroke-width', 1)
      .attr('rx', 2);
    
    // Add agreement ID text (display number)
    edgeLabels.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 3)
      .attr('fill', 'currentColor')
      .attr('font-size', '9px')
      .attr('font-weight', '500')
      .style('pointer-events', 'none')
      .text(d => {
        const agreement = agreements.find(a => a.id === d.id);
        return agreement ? getAgreementDisplayNumber(agreement, agreements).toString() : d.id;
      });
    
    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);
      
      node
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);
      
      label
        .attr('x', d => d.x!)
        .attr('y', d => d.y!);
      
      // Update edge label positions to center of each edge
      edgeLabels
        .attr('transform', (d: any) => {
          const x = (d.source.x + d.target.x) / 2;
          const y = (d.source.y + d.target.y) / 2;
          return `translate(${x}, ${y})`;
        });
    });
    
    // Stop simulation after a short time for mini graph
    setTimeout(() => {
      simulation.stop();
    }, 2000);
    
    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [founder, founders, agreements, dimensions, router]);
  
  return (
    <div className={`w-full h-full min-h-[300px] bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden ${className}`}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />
    </div>
  );
}
