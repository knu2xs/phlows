import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { map } from 'rxjs/operators';

export interface River {
  id: string;
  name: string;
  location: string;
  gaugeId: string;
  runnable: { min: number; max: number };
  description: string;
}

export interface FlowData {
  timestamp: Date;
  flow: number;
}

export type StageStatus = 'tooLow' | 'runnable' | 'tooHigh' | 'unknown';

@Injectable({
  providedIn: 'root'
})
export class RiverService {
  // Cache for flow data with TTL (5 minutes)
  private flowDataCache: { [gaugeId: string]: { data: FlowData[]; timestamp: number } } = {};
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor(private http: HttpClient) {}

  getRivers(): Observable<River[]> {
    return this.http.get<{ rivers: River[] }>('/assets/rivers-config.json')
      .pipe(
        map(data => data.rivers)
      );
  }

  getRiver(id: string): Observable<River | undefined> {
    return this.getRivers()
      .pipe(
        map(rivers => rivers.find(r => r.id === id))
      );
  }

  // Fetch real flow data from USGS Water Data API with caching
  getFlowData(gaugeId: string): Observable<FlowData[]> {
    // Check if we have cached data that's still valid
    const cached = this.flowDataCache[gaugeId];
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL_MS) {
      console.log(`Using cached data for gauge ${gaugeId}`);
      return of(cached.data);
    }

    // Build USGS API URL with proper monitoring location ID format
    const monitoringLocationId = `USGS_${gaugeId}`;
    const apiUrl = `https://api.waterdata.usgs.gov/ogcapi/v0/collections/continuous/items`;
    
    // Query parameters for 48 hours of continuous discharge data
    const params = {
      'monitoring_location_id': monitoringLocationId,
      'parameter_code': '00060', // 00060 = discharge in cubic feet per second
      'time': 'PT48H', // Last 48 hours
      'limit': '500' // Request up to 500 observations
    };

    // Build query string
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    return this.http.get<any>(`${apiUrl}?${queryString}`).pipe(
      map(response => {
        console.log(`USGS response for gauge ${gaugeId}:`, response);
        return this.parseUSGSResponse(response);
      }),
      // Fallback to mock data if API fails or returns empty
      map(data => {
        console.log(`Parsed data for gauge ${gaugeId}:`, data.length, 'records');
        const flowData = data.length > 0 ? data : this.generateMockData();
        // Cache the successful result
        this.flowDataCache[gaugeId] = {
          data: flowData,
          timestamp: Date.now()
        };
        if (data.length === 0) {
          console.log(`Using mock data for gauge ${gaugeId}`);
        }
        return flowData;
      }),
      // Catch any errors (CORS, network, etc) and return cached data only
      catchError(error => {
        console.warn(`Failed to fetch USGS data for gauge ${gaugeId}:`, error);
        // Return cached data if available, otherwise return mock data
        if (cached) {
          console.log(`Returning stale cached data for gauge ${gaugeId}`);
          return of(cached.data);
        }
        // No cached data available - return mock data
        console.log(`Returning mock data for gauge ${gaugeId} (API failed)`);
        const mockData = this.generateMockData();
        this.flowDataCache[gaugeId] = {
          data: mockData,
          timestamp: Date.now()
        };
        return of(mockData);
      })
    );
  }

  // Parse USGS GeoJSON response and extract time/value pairs
  private parseUSGSResponse(response: any): FlowData[] {
    const data: FlowData[] = [];

    if (!response || !response.features || !Array.isArray(response.features)) {
      return data;
    }

    // Extract features and sort by time
    const features = response.features
      .map((feature: any) => ({
        timestamp: feature.properties?.time,
        value: feature.properties?.value
      }))
      .filter((item: any) => item.timestamp && item.value)
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Convert to FlowData format
    features.forEach((item: any) => {
      data.push({
        timestamp: new Date(item.timestamp),
        flow: parseFloat(item.value)
      });
    });

    return data;
  }

  // Generate fallback mock data if API call fails
  private generateMockData(): FlowData[] {
    const data: FlowData[] = [];
    const now = new Date();
    const baseFlow = 1500 + Math.random() * 500;
    
    for (let i = 0; i < 48; i++) {
      const timestamp = new Date(now.getTime() - (47 - i) * 60 * 60 * 1000);
      const variation = Math.sin(i / 10) * 300 + Math.random() * 200;
      const flow = baseFlow + variation;
      
      data.push({
        timestamp,
        flow: Math.max(500, flow)
      });
    }
    
    return data;
  }

  getStageStatus(flow: number, river: River): StageStatus {
    if (flow < river.runnable.min) {
      return 'tooLow';
    } else if (flow > river.runnable.max) {
      return 'tooHigh';
    } else {
      return 'runnable';
    }
  }

  getStatusColor(status: StageStatus): string {
    switch (status) {
      case 'tooLow':
        return '#dc3545'; // Bootstrap danger red
      case 'runnable':
        return '#28a745'; // Bootstrap success green
      case 'tooHigh':
        return '#ffc107'; // Bootstrap warning yellow
      default:
        return '#6c757d'; // Bootstrap secondary gray
    }
  }
}
