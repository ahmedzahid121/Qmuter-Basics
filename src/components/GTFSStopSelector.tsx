import React, { useState, useEffect } from 'react';
import { Search, MapPin, Train, Bus, Ferry } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { gtfsService, GTFSStop } from '@/lib/gtfs-service';
import { useToast } from '@/hooks/use-toast';

interface GTFSStopSelectorProps {
  onStopSelect: (stop: GTFSStop) => void;
  placeholder?: string;
  className?: string;
}

export function GTFSStopSelector({ onStopSelect, placeholder = "Search for stops...", className }: GTFSStopSelectorProps) {
  const [query, setQuery] = useState('');
  const [stops, setStops] = useState<GTFSStop[]>([]);
  const [filteredStops, setFilteredStops] = useState<GTFSStop[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadStops();
  }, []);

  useEffect(() => {
    if (query.trim()) {
      const filtered = stops.filter(stop => 
        stop.stop_name.toLowerCase().includes(query.toLowerCase()) ||
        stop.stop_code.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredStops(filtered.slice(0, 10)); // Limit to 10 results
    } else {
      setFilteredStops([]);
    }
  }, [query, stops]);

  const loadStops = async () => {
    try {
      setLoading(true);
      const allStops = await gtfsService.getStops();
      setStops(allStops);
    } catch (error) {
      console.error('Failed to load stops:', error);
      toast({
        title: "Error",
        description: "Failed to load transport stops",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStopSelect = (stop: GTFSStop) => {
    onStopSelect(stop);
    setQuery(stop.stop_name);
    setIsOpen(false);
  };

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
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10"
          disabled={loading}
        />
      </div>

      {isOpen && (filteredStops.length > 0 || loading) && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Loading stops...
              </div>
            ) : (
              <div className="divide-y">
                {filteredStops.map((stop) => (
                  <button
                    key={stop.stop_id}
                    onClick={() => handleStopSelect(stop)}
                    className="w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <div className="flex-shrink-0 text-blue-600">
                      {getStopIcon(stop.location_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {stop.stop_name}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span>Code: {stop.stop_code}</span>
                        <Badge variant="secondary" className="text-xs">
                          {getStopTypeLabel(stop.location_type)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 flex-shrink-0">
                      {stop.stop_lat.toFixed(4)}, {stop.stop_lon.toFixed(4)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// Component for selecting nearby stops
interface NearbyStopsProps {
  lat: number;
  lng: number;
  radius?: number;
  onStopSelect: (stop: GTFSStop) => void;
}

export function NearbyStops({ lat, lng, radius = 5, onStopSelect }: NearbyStopsProps) {
  const [nearbyStops, setNearbyStops] = useState<GTFSStop[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadNearbyStops();
  }, [lat, lng, radius]);

  const loadNearbyStops = async () => {
    try {
      setLoading(true);
      const stops = await gtfsService.getStopsNearby(lat, lng, radius);
      setNearbyStops(stops);
    } catch (error) {
      console.error('Failed to load nearby stops:', error);
      toast({
        title: "Error",
        description: "Failed to load nearby stops",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStopIcon = (locationType: number) => {
    switch (locationType) {
      case 1:
        return <Train className="h-4 w-4" />;
      case 0:
        return <Bus className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Finding nearby stops...
      </div>
    );
  }

  if (nearbyStops.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No stops found within {radius}km
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">
        Nearby Stops ({nearbyStops.length})
      </h4>
      <div className="space-y-1">
        {nearbyStops.map((stop) => (
          <button
            key={stop.stop_id}
            onClick={() => onStopSelect(stop)}
            className="w-full p-2 text-left hover:bg-gray-50 rounded-md transition-colors flex items-center gap-2"
          >
            <div className="text-blue-600">
              {getStopIcon(stop.location_type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {stop.stop_name}
              </div>
              <div className="text-xs text-gray-500">
                {stop.stop_code}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 