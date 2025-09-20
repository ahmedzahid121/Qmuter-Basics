"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Loader2 } from 'lucide-react';
import { GoogleMap, Location } from './GoogleMap';

interface LazyMapProps {
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
  placeholder?: string;
  showLoadButton?: boolean;
}

export function LazyMap({
  center = { lat: -36.8485, lng: 174.7633 }, // Auckland CBD
  zoom = 12,
  markers = [],
  route,
  onMapClick,
  onMarkerClick,
  className = "w-full h-96",
  height = "400px",
  interactive = true,
  placeholder = "Click to load map",
  showLoadButton = true
}: LazyMapProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadMap = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate loading delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load map');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load map if route is provided
  useEffect(() => {
    if (route && !isLoaded && !isLoading) {
      handleLoadMap();
    }
  }, [route]);

  if (!isLoaded) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 mb-4">{placeholder}</p>
            {showLoadButton && (
              <Button
                onClick={handleLoadMap}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Map...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Load Map
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <GoogleMap
      center={center}
      zoom={zoom}
      markers={markers}
      route={route}
      onMapClick={onMapClick}
      onMarkerClick={onMarkerClick}
      className={className}
      height={height}
      interactive={interactive}
    />
  );
}

// Route preview with lazy loading
interface LazyRoutePreviewProps {
  origin: Location;
  destination: Location;
  className?: string;
  height?: string;
}

export function LazyRoutePreview({
  origin,
  destination,
  className = "w-full h-96",
  height = "400px"
}: LazyRoutePreviewProps) {
  return (
    <LazyMap
      center={origin}
      zoom={12}
      route={{ origin, destination }}
      markers={[
        { position: origin, title: 'Origin', icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' },
        { position: destination, title: 'Destination', icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }
      ]}
      className={className}
      height={height}
      interactive={false}
      placeholder="Click to preview route"
      showLoadButton={true}
    />
  );
}

// Location picker with lazy loading
interface LazyLocationPickerProps {
  onLocationSelect: (location: Location) => void;
  className?: string;
  height?: string;
}

export function LazyLocationPicker({
  onLocationSelect,
  className = "w-full h-96",
  height = "400px"
}: LazyLocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const handleMapClick = (location: Location) => {
    setSelectedLocation(location);
    onLocationSelect(location);
  };

  const handleLoadMap = () => {
    setIsMapLoaded(true);
  };

  if (!isMapLoaded) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 mb-4">Click to load location picker</p>
            <Button onClick={handleLoadMap} variant="outline">
              <MapPin className="mr-2 h-4 w-4" />
              Load Location Picker
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Click on the map to select a location
      </div>
      <GoogleMap
        center={{ lat: -36.8485, lng: 174.7633 }} // Auckland CBD
        zoom={11}
        onMapClick={handleMapClick}
        className={className}
        height={height}
        interactive={true}
      />
      {selectedLocation && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm font-medium text-blue-900">Selected Location:</p>
          <p className="text-sm text-blue-700">
            Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
} 