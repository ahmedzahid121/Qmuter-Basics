// Maps API Caching System for Cost Optimization
import { Location, Place, Directions } from './google-maps';

// Cache interfaces
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface GeocodeCacheEntry extends CacheEntry<Location> {
  address: string;
}

interface DirectionsCacheEntry extends CacheEntry<Directions> {
  origin: string;
  destination: string;
  mode: string;
}

interface PlaceCacheEntry extends CacheEntry<Place> {
  placeId: string;
}

// Cache configuration
const CACHE_CONFIG = {
  GEOCODE_TTL: 24 * 60 * 60 * 1000, // 24 hours
  DIRECTIONS_TTL: 60 * 60 * 1000, // 1 hour
  PLACE_TTL: 24 * 60 * 60 * 1000, // 24 hours
  MAX_CACHE_SIZE: 1000, // Maximum number of entries per cache
};

class MapsCache {
  private geocodeCache = new Map<string, GeocodeCacheEntry>();
  private directionsCache = new Map<string, DirectionsCacheEntry>();
  private placeCache = new Map<string, PlaceCacheEntry>();
  private sessionTokens = new Map<string, { token: string; timestamp: number }>();

  // Generate cache keys
  private getGeocodeKey(address: string): string {
    return `geocode:${address.toLowerCase().trim()}`;
  }

  private getDirectionsKey(origin: string, destination: string, mode: string): string {
    return `directions:${origin.toLowerCase()}:${destination.toLowerCase()}:${mode}`;
  }

  private getPlaceKey(placeId: string): string {
    return `place:${placeId}`;
  }

  // Cache management
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private cleanupCache<T>(cache: Map<string, CacheEntry<T>>): void {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        cache.delete(key);
      }
    }

    // Remove oldest entries if cache is too large
    if (cache.size > CACHE_CONFIG.MAX_CACHE_SIZE) {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, entries.length - CACHE_CONFIG.MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => cache.delete(key));
    }
  }

  // Geocoding cache
  getGeocode(address: string): Location | null {
    this.cleanupCache(this.geocodeCache);
    const key = this.getGeocodeKey(address);
    const entry = this.geocodeCache.get(key);
    
    if (entry && !this.isExpired(entry)) {
      return entry.data;
    }
    
    return null;
  }

  setGeocode(address: string, location: Location): void {
    const key = this.getGeocodeKey(address);
    this.geocodeCache.set(key, {
      data: location,
      timestamp: Date.now(),
      ttl: CACHE_CONFIG.GEOCODE_TTL,
      address
    });
  }

  // Directions cache
  getDirections(origin: string, destination: string, mode: string): Directions | null {
    this.cleanupCache(this.directionsCache);
    const key = this.getDirectionsKey(origin, destination, mode);
    const entry = this.directionsCache.get(key);
    
    if (entry && !this.isExpired(entry)) {
      return entry.data;
    }
    
    return null;
  }

  setDirections(origin: string, destination: string, mode: string, directions: Directions): void {
    const key = this.getDirectionsKey(origin, destination, mode);
    this.directionsCache.set(key, {
      data: directions,
      timestamp: Date.now(),
      ttl: CACHE_CONFIG.DIRECTIONS_TTL,
      origin,
      destination,
      mode
    });
  }

  // Place cache
  getPlace(placeId: string): Place | null {
    this.cleanupCache(this.placeCache);
    const key = this.getPlaceKey(placeId);
    const entry = this.placeCache.get(key);
    
    if (entry && !this.isExpired(entry)) {
      return entry.data;
    }
    
    return null;
  }

  setPlace(placeId: string, place: Place): void {
    const key = this.getPlaceKey(placeId);
    this.placeCache.set(key, {
      data: place,
      timestamp: Date.now(),
      ttl: CACHE_CONFIG.PLACE_TTL,
      placeId
    });
  }

  // Session token management
  getSessionToken(sessionId: string): string | null {
    const entry = this.sessionTokens.get(sessionId);
    if (entry && Date.now() - entry.timestamp < 60 * 60 * 1000) { // 1 hour TTL
      return entry.token;
    }
    return null;
  }

  setSessionToken(sessionId: string, token: string): void {
    this.sessionTokens.set(sessionId, {
      token,
      timestamp: Date.now()
    });
  }

  // Cache statistics
  getStats() {
    return {
      geocodeCacheSize: this.geocodeCache.size,
      directionsCacheSize: this.directionsCache.size,
      placeCacheSize: this.placeCache.size,
      sessionTokensSize: this.sessionTokens.size,
    };
  }

  // Clear all caches
  clear(): void {
    this.geocodeCache.clear();
    this.directionsCache.clear();
    this.placeCache.clear();
    this.sessionTokens.clear();
  }
}

// Singleton instance
export const mapsCache = new MapsCache();

// Client-side distance calculation (Haversine formula)
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

// Estimate travel time based on distance
export function estimateTravelTime(distanceKm: number, mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'): number {
  const speeds = {
    driving: 50, // km/h average in city
    walking: 5,
    bicycling: 15,
    transit: 30
  };
  
  return (distanceKm / speeds[mode]) * 60; // Return minutes
}

// Zone-based distance calculation for Auckland
export function calculateZoneDistance(origin: Location, destination: Location): { distance: number; zones: number[] } {
  // Auckland zone boundaries (simplified)
  const zones = [
    { name: 'CBD', center: { lat: -36.8485, lng: 174.7633 }, radius: 2 },
    { name: 'Inner', center: { lat: -36.8485, lng: 174.7633 }, radius: 8 },
    { name: 'Outer', center: { lat: -36.8485, lng: 174.7633 }, radius: 20 }
  ];

  const originDistance = calculateHaversineDistance(
    origin.lat, origin.lng, 
    zones[0].center.lat, zones[0].center.lng
  );
  
  const destDistance = calculateHaversineDistance(
    destination.lat, destination.lng, 
    zones[0].center.lat, zones[0].center.lng
  );

  // Determine zones
  const originZone = originDistance <= zones[0].radius ? 0 : 
                    originDistance <= zones[1].radius ? 1 : 2;
  const destZone = destDistance <= zones[0].radius ? 0 : 
                  destDistance <= zones[1].radius ? 1 : 2;

  const distance = calculateHaversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
  
  return {
    distance,
    zones: [originZone, destZone]
  };
} 