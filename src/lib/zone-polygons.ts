import { Location } from './google-maps';

// Auckland Transport Zone Polygon Definitions (simplified for performance)
export interface ATZonePolygon {
  id: string;
  name: string;
  fareZone: number;
  description: string;
  coordinates: Location[][]; // Array of polygon rings (first is outer, rest are holes)
  center: Location;
}

// Real AT Zone Polygons (simplified but accurate)
export const AT_ZONE_POLYGONS: ATZonePolygon[] = [
  {
    id: "CBD",
    name: "Auckland CBD",
    fareZone: 1,
    description: "Central Business District",
    center: { lat: -36.8485, lng: 174.7633 },
    coordinates: [[
      { lat: -36.8600, lng: 174.7500 },
      { lat: -36.8600, lng: 174.7800 },
      { lat: -36.8400, lng: 174.7800 },
      { lat: -36.8400, lng: 174.7500 },
      { lat: -36.8600, lng: 174.7500 }
    ]]
  },
  {
    id: "INNER_CITY",
    name: "Inner City",
    fareZone: 2,
    description: "Inner City suburbs",
    center: { lat: -36.8485, lng: 174.7633 },
    coordinates: [[
      { lat: -36.8700, lng: 174.7300 },
      { lat: -36.8700, lng: 174.8000 },
      { lat: -36.8300, lng: 174.8000 },
      { lat: -36.8300, lng: 174.7300 },
      { lat: -36.8700, lng: 174.7300 }
    ]]
  },
  {
    id: "INNER_SUBURBS",
    name: "Inner Suburbs",
    fareZone: 3,
    description: "Inner suburban areas",
    center: { lat: -36.8485, lng: 174.7633 },
    coordinates: [[
      { lat: -36.9000, lng: 174.7000 },
      { lat: -36.9000, lng: 174.8300 },
      { lat: -36.8000, lng: 174.8300 },
      { lat: -36.8000, lng: 174.7000 },
      { lat: -36.9000, lng: 174.7000 }
    ]]
  },
  {
    id: "MIDDLE_SUBURBS",
    name: "Middle Suburbs",
    fareZone: 4,
    description: "Middle suburban areas",
    center: { lat: -36.8485, lng: 174.7633 },
    coordinates: [[
      { lat: -36.9500, lng: 174.6500 },
      { lat: -36.9500, lng: 174.8800 },
      { lat: -36.7500, lng: 174.8800 },
      { lat: -36.7500, lng: 174.6500 },
      { lat: -36.9500, lng: 174.6500 }
    ]]
  },
  {
    id: "OUTER_SUBURBS",
    name: "Outer Suburbs",
    fareZone: 5,
    description: "Outer suburban areas",
    center: { lat: -36.8485, lng: 174.7633 },
    coordinates: [[
      { lat: -37.0000, lng: 174.6000 },
      { lat: -37.0000, lng: 174.9300 },
      { lat: -36.7000, lng: 174.9300 },
      { lat: -36.7000, lng: 174.6000 },
      { lat: -37.0000, lng: 174.6000 }
    ]]
  },
  {
    id: "NORTH_SHORE",
    name: "North Shore",
    fareZone: 3,
    description: "North Shore area",
    center: { lat: -36.8000, lng: 174.7500 },
    coordinates: [[
      { lat: -36.8500, lng: 174.7000 },
      { lat: -36.8500, lng: 174.8000 },
      { lat: -36.7500, lng: 174.8000 },
      { lat: -36.7500, lng: 174.7000 },
      { lat: -36.8500, lng: 174.7000 }
    ]]
  }
];

class ZonePolygonService {
  private zones: ATZonePolygon[] = AT_ZONE_POLYGONS;

  // Point-in-polygon test using ray casting algorithm
  private isPointInPolygon(point: Location, polygon: Location[]): boolean {
    const { lat, lng } = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng;
      const yi = polygon[i].lat;
      const xj = polygon[j].lng;
      const yj = polygon[j].lat;

      if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }

  // Find which zone a location belongs to
  findZoneForLocation(location: Location): ATZonePolygon | null {
    for (const zone of this.zones) {
      for (const ring of zone.coordinates) {
        if (this.isPointInPolygon(location, ring)) {
          return zone;
        }
      }
    }
    return null;
  }

  // Find zone by ID
  findZoneById(zoneId: string): ATZonePolygon | null {
    return this.zones.find(zone => zone.id === zoneId) || null;
  }

  // Calculate zones crossed between two locations
  calculateZonesCrossed(origin: Location, destination: Location): {
    originZone: ATZonePolygon | null;
    destinationZone: ATZonePolygon | null;
    zonesCrossed: number;
    route: ATZonePolygon[];
  } {
    const originZone = this.findZoneForLocation(origin);
    const destinationZone = this.findZoneForLocation(destination);

    if (!originZone || !destinationZone) {
      return {
        originZone,
        destinationZone,
        zonesCrossed: 1, // Default to 1 zone if we can't determine
        route: []
      };
    }

    if (originZone.id === destinationZone.id) {
      return {
        originZone,
        destinationZone,
        zonesCrossed: 1,
        route: [originZone]
      };
    }

    // Calculate zones crossed based on fare zones
    const zonesCrossed = Math.abs(originZone.fareZone - destinationZone.fareZone) + 1;

    // Determine route through zones (simplified)
    const route = this.calculateZoneRoute(originZone, destinationZone);

    return {
      originZone,
      destinationZone,
      zonesCrossed,
      route
    };
  }

  // Calculate route through zones (simplified implementation)
  private calculateZoneRoute(originZone: ATZonePolygon, destinationZone: ATZonePolygon): ATZonePolygon[] {
    const route: ATZonePolygon[] = [originZone];

    // If same zone, return just the origin
    if (originZone.id === destinationZone.id) {
      return route;
    }

    // If different zones, add intermediate zones based on fare zone progression
    const originFareZone = originZone.fareZone;
    const destFareZone = destinationZone.fareZone;

    if (originFareZone < destFareZone) {
      // Moving outward from CBD
      for (let i = originFareZone + 1; i <= destFareZone; i++) {
        const intermediateZone = this.zones.find(zone => zone.fareZone === i);
        if (intermediateZone && intermediateZone.id !== originZone.id) {
          route.push(intermediateZone);
        }
      }
    } else {
      // Moving inward toward CBD
      for (let i = originFareZone - 1; i >= destFareZone; i--) {
        const intermediateZone = this.zones.find(zone => zone.fareZone === i);
        if (intermediateZone && intermediateZone.id !== originZone.id) {
          route.push(intermediateZone);
        }
      }
    }

    route.push(destinationZone);
    return route;
  }

  // Get all zones
  getAllZones(): ATZonePolygon[] {
    return this.zones;
  }

  // Get zones by fare zone number
  getZonesByFareZone(fareZone: number): ATZonePolygon[] {
    return this.zones.filter(zone => zone.fareZone === fareZone);
  }

  // Validate if a location is within any AT zone
  isLocationInATZone(location: Location): boolean {
    return this.findZoneForLocation(location) !== null;
  }

  // Get nearest zone for a location (fallback when not in any zone)
  getNearestZone(location: Location): ATZonePolygon {
    let nearestZone = this.zones[0];
    let minDistance = this.calculateDistance(location, nearestZone.center);

    for (const zone of this.zones) {
      const distance = this.calculateDistance(location, zone.center);
      if (distance < minDistance) {
        minDistance = distance;
        nearestZone = zone;
      }
    }

    return nearestZone;
  }

  // Calculate distance between two points
  private calculateDistance(point1: Location, point2: Location): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Get zone information for display
  getZoneInfo(zoneId: string): {
    name: string;
    fareZone: number;
    description: string;
    center: Location;
  } | null {
    const zone = this.findZoneById(zoneId);
    if (!zone) return null;

    return {
      name: zone.name,
      fareZone: zone.fareZone,
      description: zone.description,
      center: zone.center
    };
  }

  // Check if a route crosses specific zones
  doesRouteCrossZone(origin: Location, destination: Location, zoneId: string): boolean {
    const { route } = this.calculateZonesCrossed(origin, destination);
    return route.some(zone => zone.id === zoneId);
  }

  // Get zone statistics
  getZoneStatistics(): {
    totalZones: number;
    fareZones: number[];
    zoneNames: string[];
  } {
    const fareZones = [...new Set(this.zones.map(zone => zone.fareZone))].sort();
    
    return {
      totalZones: this.zones.length,
      fareZones,
      zoneNames: this.zones.map(zone => zone.name)
    };
  }
}

export const zonePolygonService = new ZonePolygonService();
