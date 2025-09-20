"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, X, Navigation, AlertCircle, Loader2 } from 'lucide-react';
import { getPlacePredictions, getPlaceDetails, geocodeAddress, reverseGeocode, createSessionToken, Place, Location } from '@/lib/google-maps';
import { mapsCache } from '@/lib/maps-cache';
import { useToast } from '@/hooks/use-toast';

interface PlacesAutocompleteProps {
  onPlaceSelect: (place: Place) => void;
  onLocationSelect?: (location: Location) => void;
  onAddressSelect?: (location: Location, address: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  showCurrentLocation?: boolean;
  showAddressValidation?: boolean;
}

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types?: string[];
  // New API fields
  matched_substrings?: Array<{
    length: number;
    offset: number;
  }>;
  terms?: Array<{
    offset: number;
    value: string;
  }>;
}

// Mock predictions for when API fails
const mockPredictions: Prediction[] = [
  {
    place_id: 'mock_1',
    description: 'Auckland CBD, Auckland, New Zealand',
    structured_formatting: {
      main_text: 'Auckland CBD',
      secondary_text: 'Auckland, New Zealand'
    },
    types: ['locality', 'political', 'geocode']
  },
  {
    place_id: 'mock_2',
    description: 'Britomart, Auckland, New Zealand',
    structured_formatting: {
      main_text: 'Britomart',
      secondary_text: 'Auckland, New Zealand'
    },
    types: ['establishment', 'point_of_interest', 'geocode']
  },
  {
    place_id: 'mock_3',
    description: 'Queen Street, Auckland, New Zealand',
    structured_formatting: {
      main_text: 'Queen Street',
      secondary_text: 'Auckland, New Zealand'
    },
    types: ['route', 'geocode']
  },
  {
    place_id: 'mock_4',
    description: 'Auckland Airport, Auckland, New Zealand',
    structured_formatting: {
      main_text: 'Auckland Airport',
      secondary_text: 'Auckland, New Zealand'
    },
    types: ['establishment', 'point_of_interest', 'geocode']
  },
  {
    place_id: 'mock_5',
    description: 'Mount Eden, Auckland, New Zealand',
    structured_formatting: {
      main_text: 'Mount Eden',
      secondary_text: 'Auckland, New Zealand'
    },
    types: ['locality', 'political', 'geocode']
  }
];

export function PlacesAutocomplete({
  onPlaceSelect,
  onLocationSelect,
  onAddressSelect,
  placeholder = "Search for addresses, places, or landmarks...",
  className = "",
  disabled = false,
  value = "",
  onChange,
  showCurrentLocation = true,
  showAddressValidation = true
}: PlacesAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Create session token on component mount
  useEffect(() => {
    setSessionToken(createSessionToken());
  }, []);

  // Get current location on mount
  useEffect(() => {
    if (showCurrentLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }, [showCurrentLocation]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onChange?.(value);
    setApiError(null);

    if (value.length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce API calls
    debounceTimeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const predictions = await getPlacePredictions(value, sessionToken || undefined, {
          location: currentLocation || undefined,
          radius: 50000, // 50km radius
          types: 'establishment|geocode',
          language: 'en',
          components: 'country:nz'
        });
        
        // Handle both legacy and new API response formats
        const formattedPredictions = (predictions || []).map((prediction: any) => ({
          place_id: prediction.place_id,
          description: prediction.description,
          structured_formatting: prediction.structured_formatting || {
            main_text: prediction.description.split(',')[0],
            secondary_text: prediction.description.split(',').slice(1).join(',').trim()
          },
          types: prediction.types || [],
          matched_substrings: prediction.matched_substrings,
          terms: prediction.terms
        }));
        
        setPredictions(formattedPredictions);
        setShowDropdown(formattedPredictions.length > 0);
        setUseMockData(false);
      } catch (error) {
        console.error('Places API (New) error:', error);
        setApiError(error instanceof Error ? error.message : 'Failed to load predictions');
        
        // Fallback to mock data
        setPredictions(mockPredictions);
        setShowDropdown(true);
        setUseMockData(true);
        
        toast({
          title: "Search Limited",
          description: "Using limited search results. Please check your internet connection.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const handlePlaceSelect = async (prediction: Prediction) => {
    setInputValue(prediction.description);
    setShowDropdown(false);
    setPredictions([]);
    setIsLoading(true);

    try {
      if (useMockData) {
        // Handle mock data selection
        const mockPlace: Place = {
          placeId: prediction.place_id,
          name: prediction.structured_formatting.main_text,
          address: prediction.description,
          location: { lat: -36.8485, lng: 174.7633 }, // Default Auckland coordinates
          types: prediction.types || []
        };
        onPlaceSelect(mockPlace);
        return;
      }

             const placeDetails = await getPlaceDetails(prediction.place_id, sessionToken || undefined);
      onPlaceSelect(placeDetails);
    } catch (error) {
      console.error('Place details error:', error);
      toast({
        title: "Error",
        description: "Failed to get place details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressValidation = async () => {
    if (!inputValue.trim()) {
      toast({
        title: "Error",
        description: "Please enter an address to validate.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Temporarily disable geocoding validation until proper API key is configured
      // const result = await geocodeAddress(inputValue);
      
      // For now, just use the input value as-is
      const mockResult = {
        address: inputValue,
        location: { lat: -36.8485, lng: 174.7633 } // Default Auckland coordinates
      };
      
      if (onAddressSelect) {
        onAddressSelect(mockResult.location, mockResult.address);
      }
      if (onLocationSelect) {
        onLocationSelect(mockResult.location);
      }
      setInputValue(mockResult.address);
      setShowDropdown(false);
      
      toast({
        title: "Address Added",
        description: "Address added successfully (validation disabled for testing)",
        variant: "default"
      });
    } catch (error) {
      console.error('Address validation error:', error);
      toast({
        title: "Validation Failed",
        description: error instanceof Error ? error.message : "Could not validate this address.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        try {
          const address = await reverseGeocode(location.lat, location.lng);
          setInputValue(address);
          if (onLocationSelect) {
            onLocationSelect(location);
          }
          if (onAddressSelect) {
            onAddressSelect(location, address);
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          // Still provide the location even if address lookup fails
          if (onLocationSelect) {
            onLocationSelect(location);
          }
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "Location Error",
          description: "Could not get your current location. Please check your permissions.",
          variant: "destructive"
        });
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleClear = () => {
    setInputValue('');
    setPredictions([]);
    setShowDropdown(false);
    setApiError(null);
    onChange?.('');
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPlaceTypeIcon = (types?: string[]) => {
    if (!types || types.length === 0) return <MapPin className="w-4 h-4" />;
    
    if (types.includes('establishment') || types.includes('point_of_interest')) {
      return <MapPin className="w-4 h-4" />;
    }
    if (types.includes('route')) {
      return <Navigation className="w-4 h-4" />;
    }
    if (types.includes('locality') || types.includes('political')) {
      return <MapPin className="w-4 h-4" />;
    }
    
    return <MapPin className="w-4 h-4" />;
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
          className="pr-20"
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {isLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          )}
          
          {showCurrentLocation && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCurrentLocation}
              disabled={disabled || isLoading}
              className="h-8 w-8 p-0"
              title="Use current location"
            >
              <Navigation className="w-4 h-4" />
            </Button>
          )}
          
          {inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
              className="h-8 w-8 p-0"
              title="Clear"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* API Error Banner */}
      {apiError && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              {apiError}
            </span>
          </div>
          {useMockData && (
            <p className="text-xs text-yellow-700 mt-1">
              Using limited search results. Some features may not work properly.
            </p>
          )}
        </div>
      )}

      {/* Predictions Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {predictions.map((prediction, index) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handlePlaceSelect(prediction)}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center space-x-3"
            >
              {getPlaceTypeIcon(prediction.types)}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {prediction.structured_formatting.main_text}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {prediction.structured_formatting.secondary_text}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Address Validation Button */}
      {showAddressValidation && inputValue && !showDropdown && (
        <div className="mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddressValidation}
            disabled={disabled || isLoading}
            className="w-full"
          >
            <Search className="w-4 h-4 mr-2" />
            Validate Address
          </Button>
        </div>
      )}
    </div>
  );
}

// Simplified Location Search component
interface LocationSearchProps {
  onLocationSelect: (location: Location, address: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function LocationSearch({
  onLocationSelect,
  placeholder = "Search for pickup or destination...",
  className = "",
  disabled = false
}: LocationSearchProps) {
  const handlePlaceSelect = (place: Place) => {
    onLocationSelect(place.location, place.address);
  };

  return (
    <PlacesAutocomplete
      onPlaceSelect={handlePlaceSelect}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      showCurrentLocation={true}
      showAddressValidation={true}
    />
  );
}

// Current Location Button component
interface CurrentLocationButtonProps {
  onLocationSelect: (location: Location) => void;
  className?: string;
  disabled?: boolean;
}

export function CurrentLocationButton({
  onLocationSelect,
  className = "",
  disabled = false
}: CurrentLocationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        onLocationSelect(location);
        setIsLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "Location Error",
          description: "Could not get your current location. Please check your permissions.",
          variant: "destructive"
        });
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={getCurrentLocation}
      disabled={disabled || isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : (
        <Navigation className="w-4 h-4 mr-2" />
      )}
      Use Current Location
    </Button>
  );
} 