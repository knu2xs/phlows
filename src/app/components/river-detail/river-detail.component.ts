import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { RiverService, River, FlowData, StageStatus } from '../../services/river.service';
import * as d3 from 'd3';

@Component({
  selector: 'app-river-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './river-detail.component.html',
  styleUrl: './river-detail.component.sass'
})
export class RiverDetailComponent implements OnInit {
  river: River | undefined;
  flowData: FlowData[] = [];
  loading = true;
  error: string | null = null;
  currentStatus: StageStatus = 'runnable';
  currentFlow = 0;
  currentFlowTime: Date | null = null;

  constructor(
    private route: ActivatedRoute,
    private riverService: RiverService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      this.loadRiverData(id);
    });
  }

  loadRiverData(id: string): void {
    this.riverService.getRiver(id).subscribe({
      next: (river: River | undefined) => {
        if (!river) {
          this.error = 'River not found';
          this.loading = false;
          return;
        }
        this.river = river;
        this.loadFlowData(river.gaugeId);
      },
      error: (err: any) => {
        this.error = 'Failed to load river data';
        this.loading = false;
        console.error(err);
      }
    });
  }

  loadFlowData(gaugeId: string): void {
    this.riverService.getFlowData(gaugeId).subscribe({
      next: (data: FlowData[]) => {
        this.flowData = data;
        if (this.river && data.length > 0) {
          this.currentFlow = data[data.length - 1].flow;
          this.currentFlowTime = data[data.length - 1].timestamp;
          this.currentStatus = this.riverService.getStageStatus(this.currentFlow, this.river);
        }
        this.loading = false;
        setTimeout(() => this.createChart(), 0);
      },
      error: (err: any) => {
        this.error = 'Failed to load flow data';
        this.loading = false;
        console.error(err);
      }
    });
  }

  createChart(): void {
    if (!this.river) return;

    const container = document.getElementById('flow-chart') as HTMLElement;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // Clear previous chart
    d3.select('#flow-chart').selectAll('*').remove();

    const svg = d3.select('#flow-chart')
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(this.flowData, d => new Date(d.timestamp)) as [Date, Date])
      .range([0, width]);

    // Calculate dynamic Y scale bounds
    const flowValues = this.flowData.map(d => d.flow);
    const minFlow = Math.min(...flowValues);
    const maxFlow = Math.max(...flowValues);
    
    // Use runnable range as base with 20% padding
    let minBound = this.river.runnable.min * 0.8;
    let maxBound = this.river.runnable.max * 1.2;
    
    // Adjust if flows exceed the bounds
    if (minFlow < minBound) {
      minBound = minFlow * 0.9;
    }
    if (maxFlow > maxBound) {
      maxBound = maxFlow * 1.1;
    }
    
    // Ensure minimum bound is never below zero
    minBound = Math.max(0, minBound);

    const yScale = d3.scaleLinear()
      .domain([minBound, maxBound])
      .range([height, 0]);

    // Create background regions for status bands
    // Too Low Band
    svg.append('rect')
      .attr('x', 0)
      .attr('y', yScale(this.river.runnable.min))
      .attr('width', width)
      .attr('height', yScale(minBound) - yScale(this.river.runnable.min))
      .attr('fill', '#dc3545')
      .attr('opacity', 0.1);

    // Runnable Band
    svg.append('rect')
      .attr('x', 0)
      .attr('y', yScale(this.river.runnable.max))
      .attr('width', width)
      .attr('height', yScale(this.river.runnable.min) - yScale(this.river.runnable.max))
      .attr('fill', '#28a745')
      .attr('opacity', 0.15);

    // Too High Band
    svg.append('rect')
      .attr('x', 0)
      .attr('y', yScale(maxBound))
      .attr('width', width)
      .attr('height', yScale(this.river.runnable.max) - yScale(maxBound))
      .attr('fill', '#ffc107')
      .attr('opacity', 0.1);

    // Line generator
    const line = d3.line<FlowData>()
      .x(d => xScale(new Date(d.timestamp)))
      .y(d => yScale(d.flow));

    // Draw the line path
    svg.append('path')
      .datum(this.flowData)
      .attr('fill', 'none')
      .attr('stroke', '#00d4ff')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Add dots for data points
    svg.selectAll('.dot')
      .data(this.flowData)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(new Date(d.timestamp)))
      .attr('cy', d => yScale(d.flow))
      .attr('r', 3)
      .attr('fill', '#00d4ff')
      .attr('opacity', 0.6)
      .attr('class', 'dot')
      .on('mouseenter', (event: any, d: FlowData) => {
        const tooltip = d3.select('#tooltip');
        const svgElement = (document.getElementById('flow-chart') as HTMLElement).querySelector('svg') as SVGElement;
        const svgRect = svgElement.getBoundingClientRect();
        const dotX = xScale(new Date(d.timestamp)) + margin.left;
        const dotY = yScale(d.flow) + margin.top;
        
        const timestamp = new Date(d.timestamp);
        const day = String(timestamp.getDate()).padStart(2, '0');
        const month = timestamp.toLocaleString('en-US', { month: 'short' });
        const hours = String(timestamp.getHours()).padStart(2, '0');
        const minutes = String(timestamp.getMinutes()).padStart(2, '0');
        const timeStr = `${hours}:${minutes} ${day} ${month}`;
        
        tooltip
          .style('left', (svgRect.left + dotX + 8) + 'px')
          .style('top', (svgRect.top + dotY - 28) + 'px')
          .html(`${d.flow.toFixed(0)} cfs<br/><span style="font-size: 0.75rem; opacity: 0.8;">${timeStr}</span>`)
          .classed('visible', true);
        
        d3.select(event.target)
          .transition()
          .duration(200)
          .attr('r', 5)
          .attr('opacity', 1);
      })
      .on('click', (event: any, d: FlowData) => {
        // Keep tooltip visible on mobile tap
        event.stopPropagation();
      })
      .on('mouseleave', (event: any) => {
        const tooltip = d3.select('#tooltip');
        tooltip.classed('visible', false);
        
        d3.select(event.target)
          .transition()
          .duration(200)
          .attr('r', 3)
          .attr('opacity', 0.6);
      });

    // X Axis
    const xAxis = d3.axisBottom(xScale)
      .tickFormat((d: any) => {
        const date = new Date(d);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const month = date.toLocaleString('en-US', { month: 'short' });
        return `${hours}:${minutes} ${day} ${month}`;
      });
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .attr('color', '#adb5bd');

    // Y Axis
    const yAxis = d3.axisLeft(yScale);
    svg.append('g')
      .call(yAxis)
      .attr('color', '#adb5bd');

    // X Axis Label
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', '#adb5bd')
      .text('Time (Last 48 Hours)');

    // Y Axis Label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .attr('fill', '#adb5bd')
      .text('Flow (cfs)');

    // Add reference lines
    // Minimum runnable
    svg.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale(this.river.runnable.min))
      .attr('y2', yScale(this.river.runnable.min))
      .attr('stroke', '#28a745')
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.5);

    // Maximum runnable
    svg.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale(this.river.runnable.max))
      .attr('y2', yScale(this.river.runnable.max))
      .attr('stroke', '#ffc107')
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.5);

    // Add click handler to close tooltip on mobile tap
    svg.on('click', () => {
      d3.select('#tooltip').classed('visible', false);
    });
  }

  getStatusBadgeClass(): string {
    switch (this.currentStatus) {
      case 'tooLow':
        return 'bg-danger';
      case 'runnable':
        return 'bg-success';
      case 'tooHigh':
        return 'bg-warning text-dark';
      default:
        return 'bg-secondary';
    }
  }

  getStatusLabel(): string {
    switch (this.currentStatus) {
      case 'tooLow':
        return 'Too Low';
      case 'runnable':
        return 'Runnable';
      case 'tooHigh':
        return 'Too High';
      default:
        return 'Unknown';
    }
  }

  formatFlowTime(): string {
    if (!this.currentFlowTime) return '';
    const date = new Date(this.currentFlowTime);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const dayOfWeek = date.toLocaleString('en-US', { weekday: 'short' });
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    return `${hours}:${minutes} ${dayOfWeek} ${day} ${month}`;
  }
}
