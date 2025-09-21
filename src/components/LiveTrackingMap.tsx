"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Phone, 
  MessageCircle,
  RefreshCw,
  Car,
  User,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface Location {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

interface TripStatus {
  status: 'en_route_to_pickup' | 'en_route_to_dropoff' | 'completed' | 'cancelled';
  driverArrived: boolean;
  riderArrived: boolean;
  driverETA: number; // minutes
  riderETA: number; // minutes
  lastUpdated: number;
}

interface LiveTrackingData {
  tripId: string;
  driverLocation: Location;
  riderLocation: Location;
  pickupLocation: { lat: number; lng: number; address: string };
  dropoffLocation: { lat: number; lng: number; address: string };
  tripStatus: TripStatus;
  driverId: string;
  riderId: string;
}

interface LiveTrackingMapProps {
  tripId: string;
  onClose: () => void;
}

export function LiveTrackingMap({ tripId, onClose }: LiveTrackingMapProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trackingData, setTrackingData] = useState<LiveTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mock data for development - using static timestamps to avoid hydration issues
  const mockTrackingData: LiveTrackingData = {
    tripId: "trip123",
    driverLocation: {
      lat: 40.7128,
      lng: -74.0060,
      timestamp: 1704067200000, // Static timestamp
      accuracy: 10,
      speed: 25,
      heading: 90
    },
    riderLocation: {
      lat: 40.7500,
      lng: -73.9900,
      timestamp: 1704067200000, // Static timestamp
      accuracy: 15,
      speed: 0,
      heading: 0
    },
    pickupLocation: {
      lat: 40.7500,
      lng: -73.9900,
      address: "123 Main St, Anytown"
    },
    dropoffLocation: {
      lat: 40.7589,
      lng: -73.9851,
      address: "456 Business Ave, Downtown"
    },
    tripStatus: {
      status: 'en_route_to_pickup',
      driverArrived: false,
      riderArrived: false,
      driverETA: 8,
      riderETA: 5,
      lastUpdated: 1704067200000 // Static timestamp
    },
    driverId: "driver1",
    riderId: user?.uid || "rider1"
  };

  useEffect(() => {
    loadTrackingData();
    startLocationUpdates();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [tripId]);

  const loadTrackingData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTrackingData(mockTrackingData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load tracking data."
      });
    } finally {
      setLoading(false);
    }
  };

  const startLocationUpdates = () => {
    // Update location every 10 seconds
    intervalRef.current = setInterval(() => {
      updateLocation();
    }, 10000);
  };

  const updateLocation = async () => {
    if (!trackingData) return;

    setIsUpdating(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate location updates
      const updatedData = {
        ...trackingData,
        driverLocation: {
          ...trackingData.driverLocation,
          lat: trackingData.driverLocation.lat + (Math.random() - 0.5) * 0.001,
          lng: trackingData.driverLocation.lng + (Math.random() - 0.5) * 0.001,
          timestamp: Date.now() // This is fine in useEffect as it's client-side only
        },
        tripStatus: {
          ...trackingData.tripStatus,
          driverETA: Math.max(0, trackingData.tripStatus.driverETA - 1),
          lastUpdated: Date.now() // This is fine in useEffect as it's client-side only
        }
      };

      setTrackingData(updatedData);
    } catch (error) {
      console.error('Failed to update location:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleContactDriver = () => {
    // TODO: Implement contact driver functionality
    toast({
      title: "Contact Driver",
      description: "Opening contact options..."
    });
  };

  const handleMessageDriver = () => {
    // TODO: Navigate to chat
    toast({
      title: "Message Driver",
      description: "Opening chat..."
    });
  };

  const formatTime = (minutes: number) => {
    if (minutes < 1) return "Less than 1 min";
    if (minutes === 1) return "1 min";
    return `${minutes} mins`;
  };

  const getStatusColor = (status: TripStatus['status']) => {
    switch (status) {
      case 'en_route_to_pickup': return 'bg-blue-100 text-blue-800';
      case 'en_route_to_dropoff': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: TripStatus['status']) => {
    switch (status) {
      case 'en_route_to_pickup': return 'Driver en route to pickup';
      case 'en_route_to_dropoff': return 'En route to destination';
      case 'completed': return 'Trip completed';
      case 'cancelled': return 'Trip cancelled';
      default: return 'Unknown status';
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Live Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading tracking data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trackingData) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Tracking Unavailable</h3>
          <p className="text-muted-foreground mb-4">
            Unable to load tracking data for this trip.
          </p>
          <Button onClick={onClose}>Close</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Live Tracking
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={updateLocation}
              disabled={isUpdating}
            >
              <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Bar */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <Badge className={`flex items-center gap-1 ${getStatusColor(trackingData.tripStatus.status)}`}>
              <Navigation className="h-4 w-4" />
              {getStatusText(trackingData.tripStatus.status)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Last updated: {new Date(trackingData.tripStatus.lastUpdated).toLocaleTimeString()}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Car className="h-4 w-4" />
              Driver ETA: {formatTime(trackingData.tripStatus.driverETA)}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              Rider ETA: {formatTime(trackingData.tripStatus.riderETA)}
            </span>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="relative h-96 bg-muted rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Interactive Map</h3>
              <p className="text-muted-foreground">
                Real-time location tracking will be displayed here.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Driver: {trackingData.driverLocation.lat.toFixed(4)}, {trackingData.driverLocation.lng.toFixed(4)}
              </p>
            </div>
          </div>
          
          {/* Mock location indicators */}
          <div className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium">Driver</span>
            </div>
          </div>
          <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Pickup</span>
            </div>
          </div>
          <div className="absolute bottom-4 left-4 bg-white p-2 rounded-lg shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium">Destination</span>
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pickup Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{trackingData.pickupLocation.address}</span>
              </div>
              {trackingData.tripStatus.driverArrived && (
                <Badge className="mt-2 bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Driver arrived
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Destination</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{trackingData.dropoffLocation.address}</span>
              </div>
              {trackingData.tripStatus.riderArrived && (
                <Badge className="mt-2 bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Arrived at destination
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={handleContactDriver} className="flex-1">
            <Phone className="mr-2 h-4 w-4" />
            Contact Driver
          </Button>
          <Button variant="outline" onClick={handleMessageDriver} className="flex-1">
            <MessageCircle className="mr-2 h-4 w-4" />
            Message Driver
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 