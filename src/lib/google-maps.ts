import { mapsCache, calculateHaversineDistance, estimateTravelTime, calculateZoneDistance } from './maps-cache';

// Google Maps API configuration and utilities
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyAb0w0BEAcZj2RyS5ymQ_FEigsVXZhXBA8";
const GOOGLE_MAPS_BASE_URL = "https://maps.googleapis.com/maps/api";

// Validate API key with better error messages
const validateAPIKey = () => {
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === "YOUR_API_KEY") {
    throw new Error("Google Maps API key is not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.");
  }
  
  // Check if it's the default hardcoded key (which is likely invalid)
  if (GOOGLE_MAPS_API_KEY === "AIzaSyAb0w0BEAcZj2RyS5ymQ_FEigsVXZhXBA8") {
    console.warn("Using default Google Maps API key. This may not work. Please set a valid API key in your environment variables.");
  }
  
  return GOOGLE_MAPS_API_KEY;
};

// Global callback for Google Maps initialization
declare global {
  interface Window {
    initGoogleMaps: () => void;
    googleMapsLoadPromise: Promise<void>;
    googleMapsLoadResolve: () => void;
    googleMapsLoadReject: (error: Error) => void;
  }
}

// Load Google Maps API dynamically
export const loadGoogleMapsAPI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    // Set up global callback
    window.googleMapsLoadResolve = resolve;
    window.googleMapsLoadReject = reject;
    
    window.initGoogleMaps = () => {
      if (window.google && window.google.maps) {
        resolve();
      } else {
        reject(new Error('Google Maps API failed to load'));
      }
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${validateAPIKey()}&libraries=places,marker&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps API script'));
    };

    document.head.appendChild(script);
  });
};

// Geocoding API with better error handling
export const geocodeAddress = async (address: string) => {
  try {
    console.log('Geocoding address:', address);
    
    // Wait for Google Maps API to be loaded
    await loadGoogleMapsAPI();
    
    if (!window.google?.maps?.Geocoder) {
      throw new Error('Google Maps Geocoder not available');
    }
    
    const geocoder = new window.google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
      geocoder.geocode(
        { 
          address: address,
          region: 'nz' // Bias towards New Zealand
        },
        (results, status) => {
          console.log('Geocoding response:', { status, results: results?.length || 0 });
          
          if (status === 'OK' && results && results.length > 0) {
            const result = results[0];
            if (!result?.geometry?.location) {
              reject(new Error('No location data found for this address'));
              return;
            }
            console.log('Geocoding success:', result.formatted_address);
            resolve({
              address: result.formatted_address,
              location: {
                lat: result.geometry.location.lat(),
                lng: result.geometry.location.lng()
              }
            });
          } else if (status === 'ZERO_RESULTS') {
            console.log('No results found for address:', address);
            reject(new Error('No results found for this address'));
          } else if (status === 'REQUEST_DENIED') {
            console.log('Request denied - API key or billing issue');
            reject(new Error('Google Maps API key is invalid or billing is not enabled'));
          } else if (status === 'OVER_QUERY_LIMIT') {
            console.log('Query limit exceeded');
            reject(new Error('Google Maps API quota exceeded. Please try again later'));
          } else {
            console.log('Geocoding failed with status:', status);
            reject(new Error(`Geocoding failed: ${status}`));
          }
        }
      );
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
};

// Reverse geocoding
export const reverseGeocode = async (lat: number, lng: number) => {
  try {
    const apiKey = validateAPIKey();
    const params = new URLSearchParams({
      latlng: `${lat},${lng}`,
      key: apiKey,
      region: 'nz'
    });
    
    const response = await fetch(
      `${GOOGLE_MAPS_BASE_URL}/geocode/json?${params}`
    );
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].formatted_address;
    } else {
      throw new Error('Could not find address for this location');
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
};

// Places API - Place Autocomplete (New API) using Places Library
export const getPlacePredictions = async (
  input: string, 
  sessionToken?: string,
  options?: {
    location?: { lat: number; lng: number };
    radius?: number;
    types?: string;
    language?: string;
    components?: string;
  }
) => {
  try {
    // Ensure Google Maps API is loaded
    await loadGoogleMapsAPI();
    
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      throw new Error('Google Maps Places library not loaded');
    }

    // Create AutocompleteService instance
    const autocompleteService = new window.google.maps.places.AutocompleteService();
    
    // Prepare request options
    const request: any = {
      input: input,
      types: options?.types ? options.types.split('|') : ['establishment', 'geocode'],
      language: options?.language || 'en',
      componentRestrictions: { country: 'nz' }
    };
    
    // Add location biasing if provided
    if (options?.location && options?.radius) {
      request.location = new window.google.maps.LatLng(options.location.lat, options.location.lng);
      request.radius = options.radius;
    }
    
    return new Promise((resolve, reject) => {
      autocompleteService.getPlacePredictions(request, (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          console.log('Places API (New) - Found predictions:', predictions.length);
          resolve(predictions);
        } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          console.log('Places API (New) - No results found');
          resolve([]);
        } else if (status === window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
          console.error('Places API (New) - Request denied:', status);
          reject(new Error('Google Maps API key is invalid or billing is not enabled'));
        } else if (status === window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
          console.error('Places API (New) - Quota exceeded');
          reject(new Error('Google Maps API quota exceeded. Please try again later.'));
        } else if (status === window.google.maps.places.PlacesServiceStatus.INVALID_REQUEST) {
          console.error('Places API (New) - Invalid request:', status);
          reject(new Error('Invalid request parameters. Please check your input.'));
        } else {
          console.error('Places API (New) - Unknown error:', status);
          reject(new Error(`Places API failed: ${status}`));
        }
      });
    });
  } catch (error) {
    console.error('Places API (New) error:', error);
    throw error;
  }
};

// Places API - Place Details (New API) using Places Library
export const getPlaceDetails = async (placeId: string, sessionToken?: string) => {
  try {
    // Check cache first
    const cached = mapsCache.getPlace(placeId);
    if (cached) {
      return cached;
    }
    
    // Ensure Google Maps API is loaded
    await loadGoogleMapsAPI();
    
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      throw new Error('Google Maps Places library not loaded');
    }

    // Create PlacesService instance (requires a map, but we can use a dummy div)
    const dummyDiv = document.createElement('div');
    const placesService = new window.google.maps.places.PlacesService(dummyDiv);
    
    // Prepare request
    const request = {
      placeId: placeId,
      fields: ['name', 'formatted_address', 'geometry', 'place_id', 'types']
    };
    
    return new Promise((resolve, reject) => {
      placesService.getDetails(request, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const result = {
            placeId: place.place_id,
            name: place.name,
            address: place.formatted_address,
            location: {
              lat: place.geometry?.location?.lat(),
              lng: place.geometry?.location?.lng()
            },
            types: place.types || []
          };
          
          // Cache the result
          mapsCache.setPlace(placeId, result);
          console.log('Places API (New) - Place details retrieved:', result.name);
          resolve(result);
        } else if (status === window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
          console.error('Places API (New) - Request denied:', status);
          reject(new Error('Google Maps API key is invalid or billing is not enabled. Please check your configuration.'));
        } else if (status === window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
          console.error('Places API (New) - Quota exceeded');
          reject(new Error('Google Maps API quota exceeded. Please try again later.'));
        } else if (status === window.google.maps.places.PlacesServiceStatus.NOT_FOUND) {
          console.error('Places API (New) - Place not found');
          reject(new Error('Place not found. The place ID may be invalid.'));
        } else {
          console.error('Places API (New) - Unknown error:', status);
          reject(new Error(`Place details failed: ${status}`));
        }
      });
    });
  } catch (error) {
    console.error('Place details (New API) error:', error);
    throw error;
  }
};

// Directions API with caching and better error handling
export const getDirections = async (
  origin: { lat: number; lng: number } | string,
  destination: { lat: number; lng: number } | string,
  mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
) => {
  try {
    const apiKey = validateAPIKey();
    const params = new URLSearchParams({
      origin: typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`,
      destination: typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`,
      mode,
      key: apiKey,
      region: 'nz'
    });
    
    const response = await fetch(
      `${GOOGLE_MAPS_BASE_URL}/directions/json?${params}`
    );
    
    if (!response.ok) {
      throw new Error(`Directions API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.routes.length > 0) {
      const route = data.routes[0];
      const leg = route.legs[0];
      
      return {
        distance: leg.distance.text,
        duration: leg.duration.text,
        distanceValue: leg.distance.value,
        durationValue: leg.duration.value,
        polyline: route.overview_polyline.points,
        steps: leg.steps
      };
    } else if (data.status === 'ZERO_RESULTS') {
      throw new Error('No route found between the specified locations');
    } else if (data.status === 'REQUEST_DENIED') {
      throw new Error('Google Maps API key is invalid or billing is not enabled');
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      throw new Error('Google Maps API quota exceeded. Please try again later');
    } else {
      throw new Error(`Directions failed: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Directions error:', error);
    throw error;
  }
};

// Distance calculation using Directions API
export const calculateDistance = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
) => {
  try {
    const directions = await getDirections(origin, destination);
    return {
      distance: directions.distance,
      distanceValue: directions.distanceValue,
      duration: directions.duration,
      durationValue: directions.durationValue
    };
  } catch (error) {
    console.error('Distance calculation error:', error);
    throw error;
  }
};

// Simple distance estimation using Haversine formula
export const estimateDistance = (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (destination.lat - origin.lat) * Math.PI / 180;
  const dLng = (destination.lng - origin.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return {
    distance: `${distance.toFixed(1)} km`,
    distanceValue: distance * 1000 // Convert to meters
  };
};

// Create session token for cost optimization
export const createSessionToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Type definitions
export interface Location {
  lat: number;
  lng: number;
}

export interface Place {
  placeId: string;
  name: string;
  address: string;
  location: Location;
  types?: string[];
}

export interface Directions {
  distance: string;
  duration: string;
  distanceValue: number;
  durationValue: number;
  polyline: string;
  steps: any[];
} 