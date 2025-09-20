"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Search, X, Train, Bus, Navigation, AlertCircle } from 'lucide-react';
import { getPlacePredictions, getPlaceDetails, geocodeAddress, Place, Location } from '@/lib/google-maps';
import { mapsCache } from '@/lib/maps-cache';
import { useToast } from '@/hooks/use-toast';
import { GTFSStop, gtfsService } from '@/lib/gtfs-service';

interface EnhancedAddressSelectorProps {
  onStopSelect?: (stop: GTFSStop) => void;
  onAddressSelect?: (location: Location, address: string) => void;
  onLocationSelect?: (location: Location) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  showCurrentLocation?: boolean;
}

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AddressResult {
  type: 'gtfs' | 'google' | 'custom';
  data: GTFSStop | Place | Location;
  displayName: string;
  address: string;
  location: Location;
}

export function EnhancedAddressSelector({
  onStopSelect,
  onAddressSelect,
  onLocationSelect,
  placeholder = "Search for stops or addresses...",
  className = "",
  disabled = false,
  value = "",
  onChange,
  showCurrentLocation = true
}: EnhancedAddressSelectorProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [gtfsStops, setGtfsStops] = useState<GTFSStop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sessionToken, setSessionToken] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'all' | 'stops' | 'addresses'>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Create session token on mount
  useEffect(() => {
    const sessionId = `session_${Date.now()}`;
    let token = mapsCache.getSessionToken(sessionId);
    if (!token) {
      token = createSessionToken();
      mapsCache.setSessionToken(sessionId, token);
    }
    setSessionToken(token);
  }, []);

  // Load GTFS stops on mount
  useEffect(() => {
    loadGtfsStops();
  }, []);

  const loadGtfsStops = async () => {
    try {
      const stops = await gtfsService.getStops();
      setGtfsStops(stops);
    } catch (error) {
      console.error('Failed to load GTFS stops:', error);
    }
  };

  const createSessionToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Handle input changes
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onChange?.(value);

    if (value.length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Search both GTFS stops and Google Places
      const [placePredictions, filteredStops] = await Promise.all([
        searchGooglePlaces(value),
        searchGtfsStops(value)
      ]);

      setPredictions(placePredictions);
      setShowDropdown(placePredictions.length > 0 || filteredStops.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for locations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const searchGooglePlaces = async (query: string): Promise<Prediction[]> => {
    try {
      return await getPlacePredictions(query, sessionToken);
    } catch (error) {
      console.error('Google Places search error:', error);
      return [];
    }
  };

  const searchGtfsStops = async (query: string): Promise<GTFSStop[]> => {
    try {
      const stops = await gtfsService.searchStops(query);
      return stops.slice(0, 5); // Limit results
    } catch (error) {
      console.error('GTFS search error:', error);
      return [];
    }
  };

  // Handle place selection
  const handlePlaceSelect = async (prediction: Prediction) => {
    try {
      setIsLoading(true);
      const place = await getPlaceDetails(prediction.place_id, sessionToken);
      
      setInputValue(prediction.description);
      onChange?.(prediction.description);
      setPredictions([]);
      setShowDropdown(false);
      
      if (onAddressSelect) {
        onAddressSelect(place.location, place.address);
      }
      if (onLocationSelect) {
        onLocationSelect(place.location);
      }
      
      // Create new session token for next search
      setSessionToken(createSessionToken());
      
      toast({
        title: "Location Selected",
        description: place.name,
      });
    } catch (error) {
      console.error('Place details error:', error);
      toast({
        title: "Selection Error",
        description: "Failed to get location details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle GTFS stop selection
  const handleStopSelect = (stop: GTFSStop) => {
    const location: Location = {
      lat: stop.stop_lat,
      lng: stop.stop_lon,
      address: stop.stop_name
    };

    setInputValue(stop.stop_name);
    onChange?.(stop.stop_name);
    setPredictions([]);
    setShowDropdown(false);
    
    if (onStopSelect) {
      onStopSelect(stop);
    }
    if (onAddressSelect) {
      onAddressSelect(location, stop.stop_name);
    }
    if (onLocationSelect) {
      onLocationSelect(location);
    }

    toast({
      title: "Stop Selected",
      description: stop.stop_name,
    });
  };

  // Handle custom address validation
  const handleCustomAddress = async () => {
    if (!inputValue.trim()) return;

    try {
      setIsLoading(true);
      
      // Try to geocode the address
      const geocoded = await geocodeAddress(inputValue);
      
      const location: Location = {
        lat: geocoded.lat,
        lng: geocoded.lng,
        address: geocoded.formattedAddress
      };

      if (onAddressSelect) {
        onAddressSelect(location, geocoded.formattedAddress);
      }
      if (onLocationSelect) {
        onLocationSelect(location);
      }

      setPredictions([]);
      setShowDropdown(false);

      toast({
        title: "Address Validated",
        description: geocoded.formattedAddress,
      });
    } catch (error) {
      console.error('Address validation error:', error);
      toast({
        title: "Invalid Address",
        description: "Please enter a valid address or select from the suggestions.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle current location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Unavailable",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setInputValue("Current Location");
        onChange?.("Current Location");
        
        if (onLocationSelect) {
          onLocationSelect(location);
        }
        
        setIsLoading(false);
        
        toast({
          title: "Location Found",
          description: "Your current location has been selected.",
        });
      },
      (error) => {
        setIsLoading(false);
        let message = "Failed to get your location.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access was denied. Please enable location services.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
            break;
        }
        
        toast({
          title: "Location Error",
          description: message,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Handle clear input
  const handleClear = () => {
    setInputValue("");
    onChange?.("");
    setPredictions([]);
    setShowDropdown(false);
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStopIcon = (locationType: number) => {
    switch (locationType) {
      case 1: // Station
        return <Train className="h-4 w-4" />;
      case 0: // Stop
        return <Bus className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getStopTypeLabel = (locationType: number) => {
    switch (locationType) {
      case 1:
        return 'Station';
      case 0:
        return 'Stop';
      default:
        return 'Location';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          ) : inputValue ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Current Location Button */}
      {showCurrentLocation && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCurrentLocation}
          disabled={disabled || isLoading}
          className="mt-2 w-full"
        >
          <Navigation className="h-4 w-4 mr-2" />
          Use Current Location
        </Button>
      )}

      {/* Custom Address Validation */}
      {inputValue && inputValue.length > 5 && !showDropdown && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm text-blue-800">
                Address not found in suggestions
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCustomAddress}
              disabled={isLoading}
            >
              Validate Address
            </Button>
          </div>
        </div>
      )}

      {showDropdown && (predictions.length > 0 || gtfsStops.length > 0) && (
        <Card
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 shadow-lg border border-gray-200"
        >
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="stops">Stops</TabsTrigger>
                <TabsTrigger value="addresses">Addresses</TabsTrigger>
              </TabsList>

              <div className="max-h-60 overflow-y-auto">
                {/* All Results */}
                <TabsContent value="all" className="p-0">
                  {/* GTFS Stops */}
                  {gtfsStops.length > 0 && (
                    <div className="border-b border-gray-100">
                      <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-600">
                        Transport Stops
                      </div>
                      {gtfsStops.map((stop) => (
                        <button
                          key={stop.stop_id}
                          type="button"
                          onClick={() => handleStopSelect(stop)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100"
                        >
                          <div className="flex items-start space-x-3">
                            {getStopIcon(stop.location_type)}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {stop.stop_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {getStopTypeLabel(stop.location_type)} • {stop.stop_code}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              AT
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Google Places */}
                  {predictions.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-600">
                        Addresses & Places
                      </div>
                      {predictions.map((prediction) => (
                        <button
                          key={prediction.place_id}
                          type="button"
                          onClick={() => handlePlaceSelect(prediction)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-start space-x-3">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {prediction.structured_formatting.main_text}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {prediction.structured_formatting.secondary_text}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* GTFS Stops Only */}
                <TabsContent value="stops" className="p-0">
                  {gtfsStops.length > 0 ? (
                    gtfsStops.map((stop) => (
                      <button
                        key={stop.stop_id}
                        type="button"
                        onClick={() => handleStopSelect(stop)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-start space-x-3">
                          {getStopIcon(stop.location_type)}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {stop.stop_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {getStopTypeLabel(stop.location_type)} • {stop.stop_code}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            AT
                          </Badge>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500">
                      No transport stops found
                    </div>
                  )}
                </TabsContent>

                {/* Google Places Only */}
                <TabsContent value="addresses" className="p-0">
                  {predictions.length > 0 ? (
                    predictions.map((prediction) => (
                      <button
                        key={prediction.place_id}
                        type="button"
                        onClick={() => handlePlaceSelect(prediction)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-start space-x-3">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {prediction.structured_formatting.main_text}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {prediction.structured_formatting.secondary_text}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500">
                      No addresses found
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
