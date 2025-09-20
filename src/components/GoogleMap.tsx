"use client";

import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsAPI, Location, Place } from '@/lib/google-maps';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GoogleMapProps {
  center?: Location;
  zoom?: number;
  markers?: Array<{
    position: Location;
    title?: string;
    icon?: string;
  }>;
  route?: {
    origin: Location;
    destination: Location;
    polyline?: string;
  };
  onMapClick?: (location: Location) => void;
  onMarkerClick?: (marker: any) => void;
  className?: string;
  height?: string;
  interactive?: boolean;
}

declare global {
  interface Window {
    google: any;
  }
}

// Type declarations for Google Maps
declare namespace google.maps {
  class Map {
    constructor(element: HTMLElement, options?: any);
    addListener(eventName: string, handler: Function): MapsEventListener;
  }
  
  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }
  
  interface LatLngLiteral {
    lat: number;
    lng: number;
  }
  
  interface MapsEventListener {
    remove(): void;
  }
  
  enum MapTypeId {
    ROADMAP = 'roadmap'
  }
  
  enum TravelMode {
    DRIVING = 'DRIVING'
  }
  
  class DirectionsService {
    route(request: any, callback: (result: any, status: string) => void): void;
  }
  
  class DirectionsRenderer {
    constructor(options?: any);
    setMap(map: Map | null): void;
    setDirections(result: any): void;
  }
  
  namespace marker {
    class AdvancedMarkerElement {
      constructor(options: {
        position: LatLng | LatLngLiteral;
        map?: Map;
        title?: string;
        content?: HTMLElement;
      });
      addListener(eventName: string, handler: Function): MapsEventListener;
      setMap(map: Map | null): void;
      setPosition(position: LatLng | LatLngLiteral): void;
      setTitle(title: string): void;
      setContent(content: HTMLElement): void;
    }
  }
}

export function GoogleMap({
  center = { lat: -36.8485, lng: 174.7633 }, // Auckland CBD
  zoom = 12,
  markers = [],
  route,
  onMapClick,
  onMarkerClick,
  className = "w-full h-96",
  height = "400px",
  interactive = true
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setErrorDetails(null);
        
        // Load Google Maps API with detailed error handling
        await loadGoogleMapsAPI();
        
        if (!mapRef.current || !window.google) {
          throw new Error('Failed to load Google Maps API - window.google is undefined');
        }

        // Create map instance
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: interactive ? 'cooperative' : 'none',
          clickableIcons: interactive,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        setMap(mapInstance);

        // Add click listener if provided
        if (onMapClick && interactive) {
          mapInstance.addListener('click', (event: any) => {
            onMapClick({
              lat: event.latLng.lat(),
              lng: event.latLng.lng()
            });
          });
        }

        setIsLoading(false);
        
        // Log success for debugging
        console.log('Google Maps loaded successfully');
        
      } catch (err: any) {
        console.error('Google Maps initialization error:', err);
        
        // Capture detailed error information
        const errorInfo = {
          message: err.message,
          stack: err.stack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        };
        
        setErrorDetails(errorInfo);
        
        // Provide specific error messages based on error type
        let userMessage = 'Failed to load Google Maps';
        
        if (err.message.includes('InvalidKeyMapError')) {
          userMessage = 'Google Maps API key is invalid. Please check your configuration.';
        } else if (err.message.includes('RefererNotAllowedMapError')) {
          userMessage = 'Google Maps API key is not allowed for this domain. Please check referrer restrictions.';
        } else if (err.message.includes('OVER_QUERY_LIMIT')) {
          userMessage = 'Google Maps API quota exceeded. Please try again later.';
        } else if (err.message.includes('REQUEST_DENIED')) {
          userMessage = 'Google Maps API access denied. Please check billing and API key settings.';
        } else if (err.message.includes('billing')) {
          userMessage = 'Google Maps API billing is not enabled. Please enable billing in Google Cloud Console.';
        }
        
        setError(userMessage);
        setIsLoading(false);
        
        // Show toast notification
        toast({
          title: "Map Loading Error",
          description: userMessage,
          variant: "destructive"
        });
      }
    };

    initializeMap();
  }, [center, zoom, onMapClick, interactive, toast]);

  // Handle markers
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear existing markers
    mapMarkers.forEach(marker => marker.setMap(null));
    setMapMarkers([]);

    // Add new markers using AdvancedMarkerElement (non-deprecated)
    const newMarkers = markers.map(markerData => {
      // Create marker content element
      const markerContent = document.createElement('div');
      markerContent.className = 'marker-content';
      markerContent.style.cssText = `
        width: 20px;
        height: 20px;
        background-color: #3B82F6;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
      `;
      
      if (markerData.icon) {
        markerContent.style.backgroundImage = `url(${markerData.icon})`;
        markerContent.style.backgroundSize = 'cover';
        markerContent.style.backgroundPosition = 'center';
      }

      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        position: markerData.position,
        map,
        title: markerData.title,
        content: markerContent
      });

      if (onMarkerClick) {
        marker.addListener('click', () => onMarkerClick(marker));
      }

      return marker;
    });

    setMapMarkers(newMarkers);
  }, [map, markers, onMarkerClick]);

  // Handle route display
  useEffect(() => {
    if (!map || !route || !window.google) return;

    // Clear existing directions
    if (directionsRenderer) {
      directionsRenderer.setMap(null);
    }

    // Create directions service and renderer
    const directionsService = new window.google.maps.DirectionsService();
    const renderer = new window.google.maps.DirectionsRenderer({
      suppressMarkers: true, // We'll add our own markers
      polylineOptions: {
        strokeColor: '#3B82F6',
        strokeWeight: 4,
        strokeOpacity: 0.8
      }
    });

    renderer.setMap(map);
    setDirectionsRenderer(renderer);

    // Calculate and display route
    directionsService.route(
      {
        origin: route.origin,
        destination: route.destination,
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (result: any, status: any) => {
        if (status === 'OK') {
          renderer.setDirections(result);
        } else {
          console.error('Directions API error:', status);
          toast({
            title: "Route Error",
            description: `Failed to calculate route: ${status}`,
            variant: "destructive"
          });
        }
      }
    );
  }, [map, route, toast]);

  // Retry function
  const handleRetry = () => {
    setError(null);
    setErrorDetails(null);
    setIsLoading(true);
    
    // Reload the page to retry map initialization
    window.location.reload();
  };

  // Error state with detailed information
  if (error) {
    return (
      <div className={`${className} border-2 border-dashed border-red-200 bg-red-50 rounded-lg flex flex-col items-center justify-center p-6`}>
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Map Loading Failed</h3>
        <p className="text-red-600 text-center mb-4">{error}</p>
        
        <div className="space-y-2 mb-4">
          <Button onClick={handleRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        
        {/* Debug information (only in development) */}
        {process.env.NODE_ENV === 'development' && errorDetails && (
          <details className="w-full mt-4">
            <summary className="text-sm text-red-600 cursor-pointer">Debug Information</summary>
            <pre className="text-xs text-red-600 mt-2 p-2 bg-red-100 rounded overflow-auto">
              {JSON.stringify(errorDetails, null, 2)}
            </pre>
          </details>
        )}
        
        {/* Troubleshooting tips */}
        <div className="mt-4 text-sm text-red-600">
          <p className="font-medium mb-2">Troubleshooting:</p>
          <ul className="text-xs space-y-1">
            <li>• Check Google Maps API key configuration</li>
            <li>• Verify billing is enabled in Google Cloud Console</li>
            <li>• Ensure required APIs are enabled (Maps, Places, Geocoding)</li>
            <li>• Check API key restrictions for this domain</li>
          </ul>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`${className} border-2 border-dashed border-blue-200 bg-blue-50 rounded-lg flex flex-col items-center justify-center p-6`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-blue-600">Loading Google Maps...</p>
      </div>
    );
  }

  // Success state
  return (
    <div 
      ref={mapRef} 
      className={className}
      style={{ height }}
    />
  );
}

// Location Picker Component
interface LocationPickerProps {
  onLocationSelect: (location: Location) => void;
  className?: string;
  height?: string;
}

export function LocationPicker({ onLocationSelect, className = "w-full h-96", height = "400px" }: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const handleMapClick = (location: Location) => {
    setSelectedLocation(location);
    onLocationSelect(location);
  };

  return (
    <div className="space-y-4">
      <GoogleMap
        center={selectedLocation || { lat: -36.8485, lng: 174.7633 }}
        zoom={13}
        onMapClick={handleMapClick}
        className={className}
        height={height}
        interactive={true}
        markers={selectedLocation ? [{
          position: selectedLocation,
          title: "Selected Location"
        }] : []}
      />
      {selectedLocation && (
        <div className="text-sm text-gray-600">
          <MapPin className="inline h-4 w-4 mr-1" />
          Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}

// Route Display Component
interface RouteDisplayProps {
  origin: Location;
  destination: Location;
  className?: string;
  height?: string;
}

export function RouteDisplay({ origin, destination, className = "w-full h-96", height = "400px" }: RouteDisplayProps) {
  return (
    <GoogleMap
      center={origin}
      zoom={12}
      route={{ origin, destination }}
      className={className}
      height={height}
      interactive={false}
      markers={[
        {
          position: origin,
          title: "Origin",
          icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
        },
        {
          position: destination,
          title: "Destination",
          icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
        }
      ]}
    />
  );
} 