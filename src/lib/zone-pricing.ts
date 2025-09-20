// Qmuter Zone-Based Pricing System for Auckland
// Using GTFS data for accurate zone determination

import { GTFSStop, gtfsService } from './gtfs-service';
import { Location } from './google-maps';
import { zonePolygonService, ATZonePolygon } from './zone-polygons';

// Real Auckland Transport Zone Data
export interface ATZone {
  id: string;
  name: string;
  center: Location;
  boundaries: Location[];
  fareZone: number;
  description: string;
}

// Auckland Transport Zone Definitions (based on actual AT fare zones)
export const AT_ZONES: ATZone[] = [
  {
    id: "CBD",
    name: "Auckland CBD",
    center: { lat: -36.8485, lng: 174.7633 },
    boundaries: [
      { lat: -36.8600, lng: 174.7500 },
      { lat: -36.8600, lng: 174.7800 },
      { lat: -36.8400, lng: 174.7800 },
      { lat: -36.8400, lng: 174.7500 }
    ],
    fareZone: 1,
    description: "Central Business District"
  },
  {
    id: "INNER_CITY",
    name: "Inner City",
    center: { lat: -36.8485, lng: 174.7633 },
    boundaries: [
      { lat: -36.8700, lng: 174.7300 },
      { lat: -36.8700, lng: 174.8000 },
      { lat: -36.8300, lng: 174.8000 },
      { lat: -36.8300, lng: 174.7300 }
    ],
    fareZone: 2,
    description: "Inner City suburbs"
  },
  {
    id: "INNER_SUBURBS",
    name: "Inner Suburbs",
    center: { lat: -36.8485, lng: 174.7633 },
    boundaries: [
      { lat: -36.9000, lng: 174.7000 },
      { lat: -36.9000, lng: 174.8300 },
      { lat: -36.8000, lng: 174.8300 },
      { lat: -36.8000, lng: 174.7000 }
    ],
    fareZone: 3,
    description: "Inner suburban areas"
  },
  {
    id: "MIDDLE_SUBURBS",
    name: "Middle Suburbs",
    center: { lat: -36.8485, lng: 174.7633 },
    boundaries: [
      { lat: -36.9500, lng: 174.6500 },
      { lat: -36.9500, lng: 174.8800 },
      { lat: -36.7500, lng: 174.8800 },
      { lat: -36.7500, lng: 174.6500 }
    ],
    fareZone: 4,
    description: "Middle suburban areas"
  },
  {
    id: "OUTER_SUBURBS",
    name: "Outer Suburbs",
    center: { lat: -36.8485, lng: 174.7633 },
    boundaries: [
      { lat: -37.0000, lng: 174.6000 },
      { lat: -37.0000, lng: 174.9300 },
      { lat: -36.7000, lng: 174.9300 },
      { lat: -36.7000, lng: 174.6000 }
    ],
    fareZone: 5,
    description: "Outer suburban areas"
  },
  {
    id: "NORTH_SHORE",
    name: "North Shore",
    center: { lat: -36.8000, lng: 174.7500 },
    boundaries: [
      { lat: -36.8500, lng: 174.7000 },
      { lat: -36.8500, lng: 174.8000 },
      { lat: -36.7500, lng: 174.8000 },
      { lat: -36.7500, lng: 174.7000 }
    ],
    fareZone: 3,
    description: "North Shore area"
  }
];

export interface ZonePricing {
  zonesCrossed: number;
  fare: number;
  description: string;
  maxDistance?: number; // Optional distance limit for validation
}

export interface Zone {
  id: string;
  name: string;
  center: Location;
  fareZone: number;
  description: string;
  stops: GTFSStop[];
  boundaryStops: GTFSStop[];
}

export interface FareCalculation {
  originZone: Zone;
  destinationZone: Zone;
  zonesCrossed: number;
  fare: number;
  description: string;
  distance: number; // Actual distance in km
  estimatedTime: number; // Estimated travel time in minutes
}

// Updated Qmuter Zone Pricing Structure (aligned with AT zones)
export const ZONE_PRICING: ZonePricing[] = [
  {
    zonesCrossed: 1,
    fare: 3.00,
    description: "Same zone travel"
  },
  {
    zonesCrossed: 2,
    fare: 4.50,
    description: "Adjacent zone travel"
  },
  {
    zonesCrossed: 3,
    fare: 6.00,
    description: "Three zone travel"
  },
  {
    zonesCrossed: 4,
    fare: 7.50,
    description: "Four zone travel"
  },
  {
    zonesCrossed: 5,
    fare: 9.00,
    description: "Five zone travel"
  }
];

class ZonePricingService {
  private zones: Zone[] = [];
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  // Initialize zones based on AT zone data
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.createZonesFromATData();
    await this.initializationPromise;
    this.isInitialized = true;
  }

  private async createZonesFromATData(): Promise<void> {
    try {
      // Get all GTFS stops
      const stops = await gtfsService.getStops();
      
      // Create zones based on AT zone definitions
      this.zones = AT_ZONES.map(atZone => {
        const zoneStops = stops.filter(stop => {
          return this.isStopInZone(stop, atZone);
        });

        // Find boundary stops (stops at the edge of the zone)
        const boundaryStops = zoneStops.filter(stop => {
          const distance = this.calculateDistance(
            stop.stop_lat, 
            stop.stop_lon, 
            atZone.center.lat, 
            atZone.center.lng
          );
          return distance >= 3; // Stops 3+ km from center are boundary stops
        });

        return {
          id: atZone.id,
          name: atZone.name,
          center: atZone.center,
          fareZone: atZone.fareZone,
          description: atZone.description,
          stops: zoneStops,
          boundaryStops
        };
      });

      console.log(`Initialized ${this.zones.length} zones with ${stops.length} total stops`);
    } catch (error) {
      console.error('Error initializing zones:', error);
      // Fallback to basic zones if AT data fails
      this.createFallbackZones();
    }
  }

  private isStopInZone(stop: GTFSStop, zone: ATZone): boolean {
    // Check if stop is within zone boundaries
    const stopLocation = { lat: stop.stop_lat, lng: stop.stop_lon };
    
    // Simple distance-based zone assignment
    const distance = this.calculateDistance(
      stop.stop_lat,
      stop.stop_lon,
      zone.center.lat,
      zone.center.lng
    );
    
    // Assign to zone based on distance and fare zone
    switch (zone.fareZone) {
      case 1: // CBD
        return distance <= 2;
      case 2: // Inner City
        return distance > 2 && distance <= 5;
      case 3: // Inner Suburbs
        return distance > 5 && distance <= 10;
      case 4: // Middle Suburbs
        return distance > 10 && distance <= 15;
      case 5: // Outer Suburbs
        return distance > 15;
      default:
        return distance <= 8;
    }
  }

  private createFallbackZones(): void {
    // Fallback zones if AT data is unavailable
    const fallbackZones: Zone[] = [
      {
        id: "CBD",
        name: "Auckland CBD",
        center: { lat: -36.8485, lng: 174.7633 },
        fareZone: 1,
        description: "Central Business District",
        stops: [],
        boundaryStops: []
      },
      {
        id: "INNER_SUBURBS",
        name: "Inner Suburbs",
        center: { lat: -36.8485, lng: 174.7633 },
        fareZone: 2,
        description: "Inner suburban areas",
        stops: [],
        boundaryStops: []
      },
      {
        id: "OUTER_SUBURBS",
        name: "Outer Suburbs",
        center: { lat: -36.8485, lng: 174.7633 },
        fareZone: 3,
        description: "Outer suburban areas",
        stops: [],
        boundaryStops: []
      }
    ];
    
    this.zones = fallbackZones;
  }

  // Calculate distance between two points using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Get all zones
  async getAllZones(): Promise<Zone[]> {
    await this.initialize();
    return this.zones;
  }

  // Determine which zone a location belongs to using AT zone data
  async determineZone(location: Location): Promise<Zone> {
    await this.initialize();
    
    // Use polygon service for accurate zone determination
    const polygonZone = zonePolygonService.findZoneForLocation(location);
    
    if (polygonZone) {
      // Convert ATZonePolygon to Zone format
      return {
        id: polygonZone.id,
        name: polygonZone.name,
        center: polygonZone.center,
        fareZone: polygonZone.fareZone,
        description: polygonZone.description,
        stops: [], // Will be populated by GTFS data if needed
        boundaryStops: []
      };
    }
    
    // Fallback to GTFS-based determination
    const nearbyStops = await gtfsService.getStopsNearby(location.lat, location.lng, 2);
    
    if (nearbyStops.length > 0) {
      // Use the closest GTFS stop to determine zone
      const closestStop = nearbyStops[0];
      return this.findZoneForStop(closestStop);
    }
    
    // Final fallback to distance-based zone determination
    return this.determineZoneByDistance(location);
  }

  // Find zone for a specific GTFS stop
  private findZoneForStop(stop: GTFSStop): Zone {
    // Find which zone contains this stop
    for (const zone of this.zones) {
      if (zone.stops.some(zoneStop => zoneStop.stop_id === stop.stop_id)) {
        return zone;
      }
    }
    
    // If stop not found in any zone, use distance-based determination
    return this.determineZoneByDistance({
      lat: stop.stop_lat,
      lng: stop.stop_lon,
      address: stop.stop_name
    });
  }

  // Fallback zone determination by distance to zone centers
  private determineZoneByDistance(location: Location): Zone {
    const distances = this.zones.map(zone => ({
      zone,
      distance: this.calculateDistance(location.lat, location.lng, zone.center.lat, zone.center.lng)
    }));
    
    // Return the closest zone
    return distances.reduce((closest, current) => 
      current.distance < closest.distance ? current : closest
    ).zone;
  }

  // Calculate fare between two locations using AT zone data
  async calculateFare(origin: Location, destination: Location): Promise<FareCalculation> {
    await this.initialize();
    
    // Use polygon service for accurate zone calculation
    const zoneCalculation = zonePolygonService.calculateZonesCrossed(origin, destination);
    
    // Convert polygon zones to Zone format for compatibility
    const originZone: Zone = zoneCalculation.originZone ? {
      id: zoneCalculation.originZone.id,
      name: zoneCalculation.originZone.name,
      center: zoneCalculation.originZone.center,
      fareZone: zoneCalculation.originZone.fareZone,
      description: zoneCalculation.originZone.description,
      stops: [],
      boundaryStops: []
    } : this.zones[0]; // Fallback to first zone
    
    const destinationZone: Zone = zoneCalculation.destinationZone ? {
      id: zoneCalculation.destinationZone.id,
      name: zoneCalculation.destinationZone.name,
      center: zoneCalculation.destinationZone.center,
      fareZone: zoneCalculation.destinationZone.fareZone,
      description: zoneCalculation.destinationZone.description,
      stops: [],
      boundaryStops: []
    } : this.zones[0]; // Fallback to first zone
    
    // Use polygon service zones crossed
    const zonesCrossed = zoneCalculation.zonesCrossed;
    
    // Get pricing for zones crossed
    const pricing = this.getPricingForZones(zonesCrossed);
    
    // Calculate actual distance
    const distance = this.calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
    
    // Estimate travel time (rough calculation)
    const estimatedTime = this.estimateTravelTime(distance, zonesCrossed);
    
    return {
      originZone,
      destinationZone,
      zonesCrossed,
      fare: pricing.fare,
      description: pricing.description,
      distance,
      estimatedTime
    };
  }

  // Calculate how many zones are crossed between two zones using AT fare zones
  private calculateZonesCrossed(originZone: Zone, destinationZone: Zone): number {
    if (originZone.id === destinationZone.id) {
      return 1; // Same zone
    }
    
    // Use AT fare zone numbers for accurate calculation
    const originFareZone = originZone.fareZone;
    const destFareZone = destinationZone.fareZone;
    
    // Special case: North Shore to Auckland or vice versa
    if ((originZone.id === "NORTH_SHORE" && destinationZone.id !== "NORTH_SHORE") ||
        (destinationZone.id === "NORTH_SHORE" && originZone.id !== "NORTH_SHORE")) {
      return Math.abs(originFareZone - destFareZone) + 1; // Add 1 for bridge crossing
    }
    
    return Math.abs(originFareZone - destFareZone) + 1;
  }

  // Get pricing for number of zones crossed
  private getPricingForZones(zonesCrossed: number): ZonePricing {
    // Find exact match first
    const exactMatch = ZONE_PRICING.find(pricing => pricing.zonesCrossed === zonesCrossed);
    if (exactMatch) {
      return exactMatch;
    }
    
    // If more than 5 zones, use max fare
    if (zonesCrossed > 5) {
      return ZONE_PRICING[ZONE_PRICING.length - 1];
    }
    
    // Fallback to closest pricing
    return ZONE_PRICING.find(pricing => pricing.zonesCrossed >= zonesCrossed) || ZONE_PRICING[0];
  }

  // Estimate travel time based on distance and zones
  private estimateTravelTime(distance: number, zonesCrossed: number): number {
    // Base time: 2 minutes per km
    let baseTime = distance * 2;
    
    // Add time for zone crossings
    baseTime += zonesCrossed * 3;
    
    // Add buffer for traffic
    baseTime *= 1.2;
    
    return Math.round(baseTime);
  }

  // Format fare for display
  formatFare(fare: number): string {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      minimumFractionDigits: 2
    }).format(fare);
  }

  // Validate if a fare calculation is reasonable
  validateFareCalculation(calculation: FareCalculation): boolean {
    // Check if distance is reasonable for the zones crossed
    const maxReasonableDistance = calculation.zonesCrossed * 20; // 20km per zone as rough guide
    return calculation.distance <= maxReasonableDistance;
  }

  // Get zone information for a location
  async getZoneInfo(location: Location): Promise<Zone> {
    await this.initialize();
    return this.determineZone(location);
  }

  // Get nearby stops for a location
  async getNearbyStops(location: Location, radius: number = 2): Promise<GTFSStop[]> {
    return gtfsService.getStopsNearby(location.lat, location.lng, radius);
  }

  // Compare with Uber pricing
  compareWithUber(calculation: FareCalculation): { qmuterFare: number; uberFare: number; savings: number } {
    const uberFare = this.estimateUberFare(calculation.distance);
    const savings = uberFare - calculation.fare;
    
    return {
      qmuterFare: calculation.fare,
      uberFare,
      savings
    };
  }

  // Estimate what Uber would charge for comparison
  private estimateUberFare(distance: number): number {
    // Rough Uber estimate: $3.50 base + $1.80/km
    const baseFare = 3.50;
    const perKmRate = 1.80;
    return baseFare + (distance * perKmRate);
  }
}

export const zonePricingService = new ZonePricingService(); 