import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RiverService, River, StageStatus } from '../../services/river.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.sass'
})
export class DashboardComponent implements OnInit {
  rivers: River[] = [];
  currentFlows: { [key: string]: number } = {};
  failedLoads: { [key: string]: boolean } = {};
  loading = true;
  error: string | null = null;
  showOnlyRunnable = false;

  constructor(private riverService: RiverService) {}

  ngOnInit(): void {
    this.riverService.getRivers().subscribe({
      next: (rivers: River[]) => {
        this.rivers = rivers;
        this.loadFlowData();
      },
      error: (err: any) => {
        this.error = 'Failed to load river data';
        this.loading = false;
        console.error(err);
      }
    });
  }

  loadFlowData(): void {
    let loadedCount = 0;
    
    this.rivers.forEach(river => {
      this.riverService.getFlowData(river.gaugeId).subscribe({
        next: (data: any[]) => {
          if (data.length > 0) {
            // Get the latest flow reading
            this.currentFlows[river.id] = data[data.length - 1].flow;
          } else {
            this.failedLoads[river.id] = true;
          }
          loadedCount++;
          if (loadedCount === this.rivers.length) {
            this.loading = false;
          }
        },
        error: (err: any) => {
          this.failedLoads[river.id] = true;
          loadedCount++;
          console.error(`Error loading data for ${river.name}:`, err);
          if (loadedCount === this.rivers.length) {
            this.loading = false;
          }
        }
      });
    });
  }

  getStageStatus(river: River): StageStatus {
    if (this.failedLoads[river.id]) {
      return 'unknown' as StageStatus;
    }
    const flow = this.currentFlows[river.id] || 0;
    return this.riverService.getStageStatus(flow, river);
  }

  getStatusBadgeClass(status: StageStatus): string {
    switch (status) {
      case 'tooLow':
        return 'bg-danger';
      case 'runnable':
        return 'bg-success';
      case 'tooHigh':
        return 'bg-warning text-dark';
      case 'unknown':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
  }

  getStatusLabel(status: StageStatus): string {
    switch (status) {
      case 'tooLow':
        return 'Too Low';
      case 'runnable':
        return 'Runnable';
      case 'tooHigh':
        return 'Too High';
      case 'unknown':
        return 'No Data';
      default:
        return 'Unknown';
    }
  }

  getCurrentFlow(river: River): string {
    const flow = this.currentFlows[river.id];
    return flow ? flow.toFixed(0) : '—';
  }

  getFlowPercentage(river: River): number {
    const flow = this.currentFlows[river.id] || 0;
    const range = river.runnable.max - river.runnable.min;
    if (range <= 0) return 0;
    return ((flow - river.runnable.min) / range) * 100;
  }

  getDisplayedRivers(): River[] {
    let displayed = !this.showOnlyRunnable
      ? this.rivers
      : this.rivers.filter(river => this.getStageStatus(river) === 'runnable');
    
    // Sort by flow percentage (highest to lowest relative to runnable range)
    return displayed.sort((a, b) => {
      const percentA = this.getFlowPercentage(a);
      const percentB = this.getFlowPercentage(b);
      return percentB - percentA; // Descending order (highest to lowest)
    });
  }

  toggleRunnableFilter(): void {
    this.showOnlyRunnable = !this.showOnlyRunnable;
  }
}
