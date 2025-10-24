'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useRouter } from 'next/navigation';
import { Founder, Agreement, GraphNode, GraphEdge } from '@/lib/types';
import { getStatusColor } from '@/lib/agreements';
import { getEquityRemaining } from '@/lib/validation';

interface GameGraphProps {
  founders: Founder[];
  agreements: Agreement[];
  currentFounderId?: string;
  onNodeClick?: (founderId: string) => void;
  onEdgeClick?: (agreementId: string) => void;
  onZoomReset?: () => void;
  onCenterView?: () => void;
}

export function GameGraph({ 
  founders, 
  agreements, 
  currentFounderId,
  onNodeClick,
  onEdgeClick,
  onZoomReset,
  onCenterView
}: GameGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const router = useRouter();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const container = svgRef.current.parentElement;
        if (container) {
          setDimensions({
            width: container.clientWidth,
            height: Math.max(600, container.clientHeight),
          });
        }
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  // Reset zoom function
  const resetZoom = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(750).call(
        zoomRef.current.transform,
        d3.zoomIdentity
      );
    }
  }, []);

  // Center view function
  const centerView = useCallback(() => {
    if (svgRef.current && simulationRef.current && zoomRef.current) {
      const svg = d3.select(svgRef.current);
      const { width, height } = dimensions;
      
      // Calculate bounds of all nodes
      const nodes = simulationRef.current.nodes();
      if (nodes.length === 0) return;
      
      const xExtent = d3.extent(nodes, d => d.x!) as [number, number];
      const yExtent = d3.extent(nodes, d => d.y!) as [number, number];
      
      const dx = xExtent[1] - xExtent[0];
      const dy = yExtent[1] - yExtent[0];
      const x = (xExtent[0] + xExtent[1]) / 2;
      const y = (yExtent[0] + yExtent[1]) / 2;
      
      const scale = Math.min(width / dx, height / dy) * 0.8;
      const translate = [width / 2 - scale * x, height / 2 - scale * y];
      
      svg.transition().duration(750).call(
        zoomRef.current.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
      );
    }
  }, [dimensions]);

  // Expose functions to parent
  useEffect(() => {
    if (onZoomReset) {
      onZoomReset = resetZoom;
    }
    if (onCenterView) {
      onCenterView = centerView;
    }
  }, [resetZoom, centerView, onZoomReset, onCenterView]);

  useEffect(() => {
    if (!svgRef.current || founders.length === 0) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const { width, height } = dimensions;
    
    // Create nodes and edges
    const nodes: GraphNode[] = founders.map(founder => ({
      id: founder.id,
      founderName: founder.founderName,
      companyName: founder.companyName,
      x: Math.random() * width,
      y: Math.random() * height,
    }));
    
    const edges: GraphEdge[] = agreements.map(agreement => ({
      id: agreement.id,
      source: agreement.founderAId,
      target: agreement.founderBId,
      status: agreement.status,
    }));
    
    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));
    
    simulationRef.current = simulation;
    
    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    zoomRef.current = zoom;
    svg.call(zoom);
    
    // Create main group
    const g = svg.append('g');
    
    // Create edges
    const link = g.append('g')
      .selectAll('line')
      .data(edges)
      .enter().append('line')
      .attr('class', 'graph-edge')
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
      .attr('stroke-opacity', 0.8)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        if (onEdgeClick) {
          onEdgeClick(d.id);
        } else {
          router.push(`/agreement/${d.id}`);
        }
      })
      .on('mouseover', function(event, d) {
        d3.select(this).attr('stroke-width', 4).attr('stroke-opacity', 1);
        
        // Show tooltip
        const tooltip = d3.select('body').append('div')
          .attr('class', 'graph-tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
          .style('padding', '8px')
          .style('border-radius', '4px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000')
          .html(`Agreement ${d.id}<br/>Status: ${d.status}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function(event, d) {
        d3.select(this).attr('stroke-width', 2).attr('stroke-opacity', 0.8);
        d3.selectAll('.graph-tooltip').remove();
      });
    
    // Create nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('class', 'graph-node')
      .attr('r', 25)
      .attr('fill', d => {
        const founder = founders.find(f => f.id === d.id);
        if (!founder) return '#6B7280';
        
        const remaining = getEquityRemaining(founder.id);
        const percentage = remaining / founder.totalEquityAvailable;
        
        if (percentage > 0.7) return '#10B981'; // Green
        if (percentage > 0.3) return '#EAB308'; // Yellow
        return '#EF4444'; // Red
      })
      .attr('stroke', d => d.id === currentFounderId ? '#39FF14' : '#fff')
      .attr('stroke-width', d => d.id === currentFounderId ? 3 : 2)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        if (onNodeClick) {
          onNodeClick(d.id);
        } else {
          router.push(`/founder/${d.id}`);
        }
      })
      .on('mouseover', function(event, d) {
        const founder = founders.find(f => f.id === d.id);
        if (!founder) return;
        
        d3.select(this).attr('r', 30);
        
        const remaining = getEquityRemaining(founder.id);
        
        // Show tooltip
        const tooltip = d3.select('body').append('div')
          .attr('class', 'graph-tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.9)')
          .style('color', 'white')
          .style('padding', '12px')
          .style('border-radius', '6px')
          .style('font-size', '13px')
          .style('pointer-events', 'none')
          .style('z-index', '1000')
          .style('max-width', '200px')
          .html(`
            <strong>${founder.founderName}</strong><br/>
            <em>${founder.companyName}</em><br/>
            ${founder.founderType}<br/>
            <br/>
            Equity Available: ${remaining}%<br/>
            Total Equity: ${founder.totalEquityAvailable}%<br/>
            Already Swapped: ${founder.equitySwapped}%
          `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function(event, d) {
        d3.select(this).attr('r', 25);
        d3.selectAll('.graph-tooltip').remove();
      })
      .call(d3.drag<SVGCircleElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );
    
    // Create labels
    const label = g.append('g')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .attr('class', 'graph-label')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('fill', '#fff')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .style('pointer-events', 'none')
      .text(d => d.founderName.split(' ')[0]); // First name only
    
    // Create company name labels below nodes
    const companyLabel = g.append('g')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .attr('class', 'graph-label')
      .attr('text-anchor', 'middle')
      .attr('dy', 45)
      .attr('fill', 'currentColor')
      .attr('font-size', '10px')
      .style('pointer-events', 'none')
      .text(d => d.companyName);
    
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
      
      companyLabel
        .attr('x', d => d.x!)
        .attr('y', d => d.y!);
    });
    
    // Cleanup
    return () => {
      simulation.stop();
      simulationRef.current = null;
      d3.selectAll('.graph-tooltip').remove();
    };
  }, [founders, agreements, currentFounderId, dimensions, router, onNodeClick, onEdgeClick]);
  
  if (founders.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No founders yet
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Create your founder profile to get started
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full min-h-[600px] bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden graph-container">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />
    </div>
  );
}
