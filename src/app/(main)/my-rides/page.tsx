"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { LiveTrackingMap } from "@/components/LiveTrackingMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Star, 
  MessageCircle,
  Phone,
  Navigation,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

interface Ride {
  id: string;
  routeName: string;
  driverName: string;
  driverRating: number;
  startPoint: string;
  endPoint: string;
  date: string;
  time: string;
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
  seats: number;
  totalPrice: number;
  driverPhone?: string;
  driverId: string;
}

export default function MyRidesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  // Mock data for development
  const mockRides: Ride[] = [
    {
      id: "1",
      routeName: "Downtown Express",
      driverName: "John Smith",
      driverRating: 4.8,
      startPoint: "123 Main St, Anytown",
      endPoint: "456 Business Ave, Downtown",
      date: "2024-01-15",
      time: "08:00",
      status: "upcoming",
      seats: 1,
      totalPrice: 5.00,
      driverPhone: "+1-555-0123",
      driverId: "driver1"
    },
    {
      id: "2",
      routeName: "University Connector",
      driverName: "Sarah Johnson",
      driverRating: 4.9,
      startPoint: "789 College Blvd, Campus",
      endPoint: "321 University Ave, Downtown",
      date: "2024-01-10",
      time: "09:00",
      status: "completed",
      seats: 2,
      totalPrice: 10.00,
      driverPhone: "+1-555-0456",
      driverId: "driver2"
    },
    {
      id: "3",
      routeName: "Airport Shuttle",
      driverName: "Mike Wilson",
      driverRating: 4.7,
      startPoint: "Home Address",
      endPoint: "International Airport",
      date: "2024-01-08",
      time: "06:30",
      status: "completed",
      seats: 1,
      totalPrice: 15.00,
      driverPhone: "+1-555-0789",
      driverId: "driver3"
    }
  ];

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRides(mockRides);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your rides."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async (rideId: string) => {
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setRides(prev => prev.map(ride => 
        ride.id === rideId 
          ? { ...ride, status: 'cancelled' as const }
          : ride
      ));

      toast({
        title: "Ride Cancelled",
        description: "Your ride has been cancelled successfully."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel ride."
      });
    }
  };

  const handleContactDriver = (ride: Ride) => {
    if (ride.driverPhone) {
      window.open(`tel:${ride.driverPhone}`);
    } else {
      toast({
        title: "Contact Driver",
        description: "Driver contact information not available."
      });
    }
  };

  const handleMessageDriver = (ride: Ride) => {
    // TODO: Navigate to chat with driver
    toast({
      title: "Message Driver",
      description: "Opening chat with driver..."
    });
  };

  const handleTrackRide = (ride: Ride) => {
    setSelectedTripId(ride.id);
  };

  const getStatusColor = (status: Ride['status']) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Ride['status']) => {
    switch (status) {
      case 'upcoming': return <Calendar className="h-4 w-4" />;
      case 'in-progress': return <Navigation className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const upcomingRides = rides.filter(ride => ride.status === 'upcoming');
  const activeRides = rides.filter(ride => ride.status === 'in-progress');
  const completedRides = rides.filter(ride => ride.status === 'completed');
  const cancelledRides = rides.filter(ride => ride.status === 'cancelled');

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">My Rides</h1>
        <p className="text-muted-foreground">
          Manage your upcoming and past rides.
        </p>
      </header>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingRides.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({activeRides.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedRides.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({cancelledRides.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : upcomingRides.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No upcoming rides</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any upcoming rides scheduled.
                </p>
                <Button onClick={() => window.location.href = '/find-ride'}>
                  Find a Ride
                </Button>
              </CardContent>
            </Card>
          ) : (
            upcomingRides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                onCancel={handleCancelRide}
                onContact={handleContactDriver}
                onMessage={handleMessageDriver}
                onTrack={handleTrackRide}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4 mt-6">
          {activeRides.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Navigation className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active rides</h3>
                <p className="text-muted-foreground">
                  You don't have any rides in progress.
                </p>
              </CardContent>
            </Card>
          ) : (
            activeRides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                onCancel={handleCancelRide}
                onContact={handleContactDriver}
                onMessage={handleMessageDriver}
                onTrack={handleTrackRide}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {completedRides.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No completed rides</h3>
                <p className="text-muted-foreground">
                  Your completed rides will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            completedRides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                onCancel={handleCancelRide}
                onContact={handleContactDriver}
                onMessage={handleMessageDriver}
                onTrack={handleTrackRide}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4 mt-6">
          {cancelledRides.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No cancelled rides</h3>
                <p className="text-muted-foreground">
                  Your cancelled rides will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            cancelledRides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                onCancel={handleCancelRide}
                onContact={handleContactDriver}
                onMessage={handleMessageDriver}
                onTrack={handleTrackRide}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Live Tracking Modal */}
      {selectedTripId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <LiveTrackingMap
              tripId={selectedTripId}
              onClose={() => setSelectedTripId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const RideCard = ({ 
  ride, 
  onCancel, 
  onContact, 
  onMessage, 
  onTrack 
}: { 
  ride: Ride; 
  onCancel: (rideId: string) => void;
  onContact: (ride: Ride) => void;
  onMessage: (ride: Ride) => void;
  onTrack: (ride: Ride) => void;
}) => {
  const getStatusColor = (status: Ride['status']) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Ride['status']) => {
    switch (status) {
      case 'upcoming': return <Calendar className="h-4 w-4" />;
      case 'in-progress': return <Navigation className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">{ride.routeName}</h3>
            <p className="text-sm text-muted-foreground">
              Driver: {ride.driverName} • ⭐ {ride.driverRating}
            </p>
          </div>
          <Badge className={`flex items-center gap-1 ${getStatusColor(ride.status)}`}>
            {getStatusIcon(ride.status)}
            {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">From</p>
              <p className="text-sm text-muted-foreground">{ride.startPoint}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">To</p>
              <p className="text-sm text-muted-foreground">{ride.endPoint}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(ride.date).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {ride.time}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {ride.seats} seat(s)
            </span>
            <span className="font-medium text-foreground">
              ${ride.totalPrice}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {(ride.status === 'upcoming' || ride.status === 'in-progress') && (
            <>
              <Button variant="outline" size="sm" onClick={() => onTrack(ride)}>
                <Navigation className="mr-2 h-4 w-4" />
                Track Ride
              </Button>
              <Button variant="outline" size="sm" onClick={() => onMessage(ride)}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Message
              </Button>
              <Button variant="outline" size="sm" onClick={() => onContact(ride)}>
                <Phone className="mr-2 h-4 w-4" />
                Call
              </Button>
              {ride.status === 'upcoming' && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => onCancel(ride.id)}
                >
                  Cancel
                </Button>
              )}
            </>
          )}
          {ride.status === 'completed' && (
            <Button variant="outline" size="sm" onClick={() => onMessage(ride)}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Message Driver
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
