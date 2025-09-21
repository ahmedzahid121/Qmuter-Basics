import { apiService } from './api';

// GTFS Data Types - Simplified for ride-sharing needs
export interface GTFSStop {
  stop_id: string;
  stop_code: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  location_type: number;
  wheelchair_boarding?: number;
  parent_station?: string;
  stop_desc?: string;
  zone_id?: string;
  stop_url?: string;
  stop_timezone?: string;
  platform_code?: string;
  parent_name?: string;
  pid_name?: string;
}

export interface GTFSRoute {
  route_id: string;
  agency_id: string;
  route_short_name: string;
  route_long_name: string;
  route_desc?: string;
  route_type: number;
  route_url?: string;
  route_color?: string;
  route_text_color?: string;
  route_sort_order?: number;
}

export interface GTFSAgency {
  agency_id: string;
  agency_name: string;
  agency_url: string;
  agency_timezone: string;
  agency_lang: string;
  agency_phone: string;
}

// AT API Response Types
interface ATAPIResponse<T> {
  data: Array<{
    type: string;
    id: string;
    attributes: T;
  }>;
}

interface ATAPISingleResponse<T> {
  data: {
    type: string;
    id: string;
    attributes: T;
  };
}

interface ATAPIError {
  errors: Array<{
    status: string;
    title: string;
    detail: string;
    code?: string;
    source?: {
      parameter: string;
    };
  }>;
}

// Cache interface for Firestore
interface GTFSDataCache {
  data: any;
  cachedAt: string;
  expiresAt: string;
}

class GTFSService {
  private baseURL = 'https://api.at.govt.nz/v2/gtfs';
  private stops: GTFSStop[] = [];
  private routes: GTFSRoute[] = [];
  private agencies: GTFSAgency[] = [];
  
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private lastCacheTime = 0;
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours for static data

  // Initialize with essential data only
  async initialize(): Promise<void> {
    if (this.isInitialized && Date.now() - this.lastCacheTime < this.cacheExpiry) {
      return;
    }
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.loadEssentialData();
    await this.initializationPromise;
    this.isInitialized = true;
    this.lastCacheTime = Date.now();
  }

  private async loadEssentialData(): Promise<void> {
    try {
      console.log('Loading GTFS essential data from AT API...');
      
      // Load stops, routes, and agencies through our backend proxy
      await Promise.all([
        this.loadStops(),
        this.loadRoutes(),
        this.loadAgencies()
      ]);

      console.log(`GTFS loaded: ${this.stops.length} stops, ${this.routes.length} routes, ${this.agencies.length} agencies`);
    } catch (error) {
      console.error('Failed to load GTFS data:', error);
      throw error;
    }
  }

  // Make API request through our backend proxy (which handles authentication)
  private async makeAPIRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://australia-southeast2-qmuter-pro.cloudfunctions.net/api';
    const url = new URL(`${baseURL}/v1/gtfs${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: ATAPIError = await response.json();
      throw new Error(`AT API Error: ${errorData.errors?.[0]?.detail || response.statusText}`);
    }

    return response.json();
  }

  private async loadStops(): Promise<void> {
    try {
      const response = await this.makeAPIRequest<{ data: GTFSStop[] }>('/stops');
      this.stops = response.data;
    } catch (error) {
      console.warn('Failed to load stops from AT API, using fallback data:', error);
      this.stops = await this.loadStopsFromFile();
    }
  }

  private async loadRoutes(): Promise<void> {
    try {
      const response = await this.makeAPIRequest<{ data: GTFSRoute[] }>('/routes');
      this.routes = response.data;
    } catch (error) {
      console.warn('Failed to load routes from AT API, using fallback data:', error);
      this.routes = await this.loadRoutesFromFile();
    }
  }

  private async loadAgencies(): Promise<void> {
    try {
      const response = await this.makeAPIRequest<{ data: GTFSAgency[] }>('/agencies');
      this.agencies = response.data;
    } catch (error) {
      console.warn('Failed to load agencies from AT API, using fallback data:', error);
      this.agencies = await this.loadAgenciesFromFile();
    }
  }

  // Fallback methods for local file loading (keep for offline/error scenarios)
  private async loadStopsFromFile(): Promise<GTFSStop[]> {
    return [
      {
        stop_id: "100-56c57897",
        stop_code: "100",
        stop_name: "Papatoetoe Train Station",
        stop_lat: -36.97766,
        stop_lon: 174.84925,
        location_type: 1
      },
      {
        stop_id: "101-9ef61446",
        stop_code: "101",
        stop_name: "Otahuhu Train Station",
        stop_lat: -36.94669,
        stop_lon: 174.83321,
        location_type: 1
      },
      {
        stop_id: "102-a4eddeea",
        stop_code: "102",
        stop_name: "Penrose Train Station",
        stop_lat: -36.91009,
        stop_lon: 174.8157,
        location_type: 1
      },
      {
        stop_id: "103-be3d2b7e",
        stop_code: "103",
        stop_name: "Glen Innes Train Station",
        stop_lat: -36.8788,
        stop_lon: 174.85412,
        location_type: 1
      },
      {
        stop_id: "104-ff3dff29",
        stop_code: "104",
        stop_name: "Morningside Train Station",
        stop_lat: -36.87498,
        stop_lon: 174.73521,
        location_type: 1
      },
      {
        stop_id: "105-474861ff",
        stop_code: "105",
        stop_name: "Avondale Train Station",
        stop_lat: -36.89714,
        stop_lon: 174.6991,
        location_type: 1
      }
    ];
  }

  private async loadRoutesFromFile(): Promise<GTFSRoute[]> {
    return [
      {
        route_id: "101-202",
        agency_id: "NZB",
        route_short_name: "101",
        route_long_name: "101",
        route_type: 3
      },
      {
        route_id: "105-202",
        agency_id: "NZB",
        route_short_name: "105",
        route_long_name: "105",
        route_type: 3
      },
      {
        route_id: "GULF-209",
        agency_id: "FGL",
        route_short_name: "GULF",
        route_long_name: "GULF",
        route_type: 4,
        route_color: "00B1BF"
      }
    ];
  }

  private async loadAgenciesFromFile(): Promise<GTFSAgency[]> {
    return [
      {
        agency_id: "AM",
        agency_name: "AT Metro",
        agency_url: "http://www.aucklandtransport.govt.nz",
        agency_timezone: "Pacific/Auckland",
        agency_lang: "en",
        agency_phone: "(09)355-3553"
      },
      {
        agency_id: "FGL",
        agency_name: "Fullers360",
        agency_url: "http://www.aucklandtransport.govt.nz",
        agency_timezone: "Pacific/Auckland",
        agency_lang: "en",
        agency_phone: "(09)355-3553"
      },
      {
        agency_id: "NZB",
        agency_name: "New Zealand Bus",
        agency_url: "http://www.aucklandtransport.govt.nz",
        agency_timezone: "Pacific/Auckland",
        agency_lang: "en",
        agency_phone: "(09)355-3553"
      }
    ];
  }

  // ===== CORE RIDE-SHARING METHODS =====

  // Get all stops (for pickup/dropoff selection)
  async getStops(): Promise<GTFSStop[]> {
    await this.initialize();
    return this.stops;
  }

  // Search stops by name (for user search)
  async searchStops(query: string): Promise<GTFSStop[]> {
    await this.initialize();
    const lowerQuery = query.toLowerCase();
    return this.stops.filter(stop => 
      stop.stop_name.toLowerCase().includes(lowerQuery) ||
      stop.stop_code.toLowerCase().includes(lowerQuery)
    );
  }

  // Get stops near a location (for nearby pickup points)
  async getStopsNearby(lat: number, lng: number, radiusKm: number = 5): Promise<GTFSStop[]> {
    await this.initialize();
    return this.stops.filter(stop => {
      const distance = this.calculateDistance(lat, lng, stop.stop_lat, stop.stop_lon);
      return distance <= radiusKm;
    });
  }

  // Get all routes (for route information)
  async getRoutes(): Promise<GTFSRoute[]> {
    await this.initialize();
    return this.routes;
  }

  // Get routes by type (Bus, Train, Ferry)
  async getRoutesByType(type: number): Promise<GTFSRoute[]> {
    try {
      const response = await this.makeAPIRequest<{ data: GTFSRoute[] }>('/routes', {
        'route_type': type.toString()
      });
      return response.data;
    } catch (error) {
      console.warn(`Failed to load routes by type ${type} from AT API, using cached data:`, error);
      await this.initialize();
      return this.routes.filter(route => route.route_type === type);
    }
  }

  // Get routes by short name (specific route numbers)
  async getRoutesByShortName(shortName: string): Promise<GTFSRoute[]> {
    try {
      const response = await this.makeAPIRequest<{ data: GTFSRoute[] }>('/routes', {
        'route_short_name': shortName
      });
      return response.data;
    } catch (error) {
      console.warn(`Failed to load routes by short name ${shortName} from AT API, using cached data:`, error);
      await this.initialize();
      return this.routes.filter(route => route.route_short_name === shortName);
    }
  }

  // Get routes by agency
  async getRoutesByAgency(agencyId: string): Promise<GTFSRoute[]> {
    await this.initialize();
    return this.routes.filter(route => route.agency_id === agencyId);
  }

  // Get all agencies
  async getAgencies(): Promise<GTFSAgency[]> {
    await this.initialize();
    return this.agencies;
  }

  // Get agency by ID
  async getAgency(agencyId: string): Promise<GTFSAgency | undefined> {
    await this.initialize();
    return this.agencies.find(agency => agency.agency_id === agencyId);
  }

  // Get specific stop by ID
  async getStopById(stopId: string): Promise<GTFSStop | null> {
    try {
      const response = await this.makeAPIRequest<{ data: GTFSStop }>(`/stops/${stopId}`);
      return response.data;
    } catch (error) {
      console.warn(`Failed to load stop ${stopId}:`, error);
      return null;
    }
  }

  // Get specific route by ID
  async getRouteById(routeId: string): Promise<GTFSRoute | null> {
    try {
      const response = await this.makeAPIRequest<{ data: GTFSRoute }>(`/routes/${routeId}`);
      return response.data;
    } catch (error) {
      console.warn(`Failed to load route ${routeId}:`, error);
      return null;
    }
  }

  // ===== RIDE-SHARING SPECIFIC METHODS =====

  // Get popular routes for ride-sharing (bus routes are most common)
  async getPopularRoutes(): Promise<GTFSRoute[]> {
    try {
      // Get bus routes (type 3) which are typically the most popular for ride-sharing
      const busRoutes = await this.getRoutesByType(3);
      
      // Sort by route_short_name to get numeric routes first
      return busRoutes.sort((a, b) => {
        const aNum = parseInt(a.route_short_name) || 0;
        const bNum = parseInt(b.route_short_name) || 0;
        return aNum - bNum;
      }).slice(0, 20); // Return top 20 routes
    } catch (error) {
      console.warn('Failed to load popular routes:', error);
      return [];
    }
  }

  // Get ferry routes (for island connections)
  async getFerryRoutes(): Promise<GTFSRoute[]> {
    return this.getRoutesByType(4);
  }

  // Get train routes (for longer distance connections)
  async getTrainRoutes(): Promise<GTFSRoute[]> {
    return this.getRoutesByType(2);
  }

  // Find stops along a route (for pickup/dropoff points)
  async getStopsByRoute(routeId: string): Promise<GTFSStop[]> {
    try {
      const response = await this.makeAPIRequest<{ data: GTFSStop[] }>(`/routes/${routeId}/stops`);
      return response.data;
    } catch (error) {
      console.warn(`Failed to load stops for route ${routeId}:`, error);
      return [];
    }
  }

  // ===== UTILITY METHODS =====

  // Calculate distance between two points
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Get route type name for display
  getRouteTypeName(type: number): string {
    switch (type) {
      case 0: return 'Tram';
      case 1: return 'Subway';
      case 2: return 'Train';
      case 3: return 'Bus';
      case 4: return 'Ferry';
      case 5: return 'Cable Car';
      case 6: return 'Gondola';
      case 7: return 'Funicular';
      default: return 'Unknown';
    }
  }

  // Get route type icon for display
  getRouteTypeIcon(type: number): string {
    switch (type) {
      case 0: return '🚊';
      case 1: return '🚇';
      case 2: return '🚆';
      case 3: return '🚌';
      case 4: return '⛴️';
      case 5: return '🚡';
      case 6: return '🚠';
      case 7: return '🚞';
      default: return '🚗';
    }
  }

  // Get stop type icon
  getStopTypeIcon(locationType: number): string {
    switch (locationType) {
      case 0: return '🚏'; // Stop
      case 1: return '🚉'; // Station
      case 2: return '🚉'; // Station entrance
      case 3: return '🚏'; // Generic node
      case 4: return '🚏'; // Boarding area
      default: return '📍';
    }
  }

  // Get stop type label
  getStopTypeLabel(locationType: number): string {
    switch (locationType) {
      case 0: return 'Stop';
      case 1: return 'Station';
      case 2: return 'Station Entrance';
      case 3: return 'Node';
      case 4: return 'Boarding Area';
      default: return 'Location';
    }
  }

  // Clear cache to force refresh
  clearCache(): void {
    this.isInitialized = false;
    this.initializationPromise = null;
    this.lastCacheTime = 0;
    this.stops = [];
    this.routes = [];
    this.agencies = [];
  }
}

export const gtfsService = new GTFSService(); 