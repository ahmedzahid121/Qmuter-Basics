import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, ArrowRight, Loader2 } from "lucide-react";
import { PlacesAutocomplete } from "@/components/PlacesAutocomplete";
import { Location } from "@/lib/google-maps";
import { apiService } from "@/lib/api";

interface SearchState {
  origin: Location | null;
  destination: Location | null;
  snappedOrigin: { stopId: string; name: string; distance: number } | null;
  snappedDestination: { stopId: string; name: string; distance: number } | null;
}

interface SearchPanelProps {
  onSearch: (searchData: SearchState) => void;
  searchState: SearchState;
  isSearching: boolean;
  userRole: 'driver' | 'rider';
}

export default function SearchPanel({ onSearch, searchState, isSearching, userRole }: SearchPanelProps) {
  const [originLocation, setOriginLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<Location | null>(null);
  const [originAddress, setOriginAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");

  const handleSearch = async () => {
    if (!originLocation || !destinationLocation) return;
    
    try {
      // Call backend API to get route suggestions
      const response = await apiService.getRoutes({
        lat: originLocation.lat,
        lng: originLocation.lng,
        radius: 5000
      });

      if (response.success) {
        // Mock snapped stops for now (backend will provide this)
        const searchData: SearchState = {
          origin: originLocation,
          destination: destinationLocation,
          snappedOrigin: { 
            stopId: "s100", 
            name: "Queen St Stop 6123", 
            distance: 120 
          },
          snappedDestination: { 
            stopId: "s240", 
            name: "Grey Lynn Stop 8456", 
            distance: 90 
          }
        };
        
        onSearch(searchData);
      }
    } catch (error) {
      console.error('Error searching routes:', error);
      // Fallback to mock data if API fails
      const searchData: SearchState = {
        origin: originLocation,
        destination: destinationLocation,
        snappedOrigin: { 
          stopId: "s100", 
          name: "Queen St Stop 6123", 
          distance: 120 
        },
        snappedDestination: { 
          stopId: "s240", 
          name: "Grey Lynn Stop 8456", 
          distance: 90 
        }
      };
      
      onSearch(searchData);
    }
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: "Current Location"
          };
          setOriginLocation(location);
          setOriginAddress("Current Location");
        },
        (error) => {
          console.error('Error getting current location:', error);
        }
      );
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-blue-600" />
          {userRole === 'driver' ? 'Plan Your Route' : 'Find Your Route'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Origin */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">From</label>
          <div className="relative">
            <PlacesAutocomplete
              onPlaceSelect={(place) => {
                if (place.geometry?.location) {
                  setOriginLocation(place.geometry.location);
                  setOriginAddress(place.formatted_address);
                }
              }}
              onAddressSelect={(location, address) => {
                setOriginLocation(location);
                setOriginAddress(address);
              }}
              placeholder="Enter pickup location..."
              value={originAddress}
              onChange={setOriginAddress}
              showCurrentLocation={true}
            />
            {originLocation && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                <MapPin className="h-3 w-3" />
                <span>
                  {originLocation.lat.toFixed(6)}, {originLocation.lng.toFixed(6)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Destination */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">To</label>
          <div className="relative">
            <PlacesAutocomplete
              onPlaceSelect={(place) => {
                if (place.geometry?.location) {
                  setDestinationLocation(place.geometry.location);
                  setDestinationAddress(place.formatted_address);
                }
              }}
              onAddressSelect={(location, address) => {
                setDestinationLocation(location);
                setDestinationAddress(address);
              }}
              placeholder="Enter destination..."
              value={destinationAddress}
              onChange={setDestinationAddress}
              showCurrentLocation={false}
            />
            {destinationLocation && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                <MapPin className="h-3 w-3" />
                <span>
                  {destinationLocation.lat.toFixed(6)}, {destinationLocation.lng.toFixed(6)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          disabled={!originLocation || !destinationLocation || isSearching}
          className="w-full"
        >
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <ArrowRight className="mr-2 h-4 w-4" />
              {userRole === 'driver' ? 'Plan Route' : 'Find Routes'}
            </>
          )}
        </Button>

        {/* Current Location Button */}
        <Button
          variant="outline"
          onClick={useCurrentLocation}
          className="w-full"
        >
          <MapPin className="mr-2 h-4 w-4" />
          Use Current Location
        </Button>
      </CardContent>
    </Card>
  );
}
