"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  Calendar,
  Filter,
  SortAsc,
  SortDesc
} from "lucide-react";
import { Route } from "@/types";
import { BookingModal } from "@/components/BookingModal";
import { PopularRoutes } from "@/components/PopularRoutes";
import { GTFSRoute } from "@/lib/gtfs-service";

export default function FindRidePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    origin: "",
    destination: "",
    date: "",
    time: ""
  });
  const [filters, setFilters] = useState({
    maxPrice: "",
    minSeats: "",
    sortBy: "departureTime" as "departureTime" | "price" | "rating"
  });
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Mock data for development
  const mockRoutes: Route[] = [
    {
      id: "1",
      driverId: "driver1",
      driverInfo: {
        displayName: "John Smith",
        photoURL: null,
        rating: 4.8
      },
      routeName: "Downtown Express",
      startPoint: {
        address: "123 Main St, Anytown",
        lat: 40.7128,
        lng: -74.0060
      },
      endPoint: {
        address: "456 Business Ave, Downtown",
        lat: 40.7589,
        lng: -73.9851
      },
      schedule: "Mon-Fri, 8:00 AM",
      totalSeats: 4,
      bookedSeats: 2,
      upvotes: 15,
      isOfficial: false
    },
    {
      id: "2",
      driverId: "driver2",
      driverInfo: {
        displayName: "Sarah Johnson",
        photoURL: null,
        rating: 4.9
      },
      routeName: "University Connector",
      startPoint: {
        address: "789 College Blvd, Campus",
        lat: 40.7500,
        lng: -73.9900
      },
      endPoint: {
        address: "321 University Ave, Downtown",
        lat: 40.7600,
        lng: -73.9800
      },
      schedule: "Mon-Fri, 9:00 AM",
      totalSeats: 3,
      bookedSeats: 1,
      upvotes: 12,
      isOfficial: true
    }
  ];

  useEffect(() => {
    // Load routes on component mount
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/v1/routes?status=active');
      // const data = await response.json();
      // setRoutes(data.routes);
      
      // Using mock data for now
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      setRoutes(mockRoutes);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load routes. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // TODO: Implement search logic
    toast({
      title: "Search",
      description: "Search functionality coming soon!"
    });
  };

  const handleBookRide = (route: Route) => {
    setSelectedRoute(route);
    setIsBookingModalOpen(true);
  };

  const handleBookingSuccess = () => {
    // Refresh routes after successful booking
    loadRoutes();
  };

  const filteredRoutes = routes.filter(route => {
    if (searchParams.origin && !route.startPoint.address.toLowerCase().includes(searchParams.origin.toLowerCase())) {
      return false;
    }
    if (searchParams.destination && !route.endPoint.address.toLowerCase().includes(searchParams.destination.toLowerCase())) {
      return false;
    }
    if (filters.maxPrice && route.totalSeats > parseInt(filters.maxPrice)) {
      return false;
    }
    if (filters.minSeats && (route.totalSeats - route.bookedSeats) < parseInt(filters.minSeats)) {
      return false;
    }
    return true;
  });

  const sortedRoutes = [...filteredRoutes].sort((a, b) => {
    switch (filters.sortBy) {
      case "price":
        return a.totalSeats - b.totalSeats;
      case "rating":
        return b.driverInfo.rating - a.driverInfo.rating;
      case "departureTime":
      default:
        return 0; // TODO: Implement time-based sorting
    }
  });

  return (
    <div className="container mx-auto max-w-6xl p-4 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Find a Ride</h1>
        <p className="text-muted-foreground">
          Discover and book rides from your community.
        </p>
      </header>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Routes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">From</label>
              <Input
                placeholder="Enter origin"
                value={searchParams.origin}
                onChange={(e) => setSearchParams(prev => ({ ...prev, origin: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">To</label>
              <Input
                placeholder="Enter destination"
                value={searchParams.destination}
                onChange={(e) => setSearchParams(prev => ({ ...prev, destination: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={searchParams.date}
                onChange={(e) => setSearchParams(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Time</label>
              <Input
                type="time"
                value={searchParams.time}
                onChange={(e) => setSearchParams(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>
          </div>
          <Button onClick={handleSearch} className="w-full">
            <Search className="mr-2 h-4 w-4" />
            Search Routes
          </Button>
        </CardContent>
      </Card>

      {/* Popular Routes Section */}
      <PopularRoutes 
        onRouteSelect={(route: GTFSRoute) => {
          toast({
            title: "Route Selected",
            description: `${route.route_short_name} - ${route.route_long_name}`,
          });
        }}
      />

      {/* Filters and Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Max Price</label>
                <Input
                  placeholder="Any"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Min Available Seats</label>
                <Input
                  placeholder="Any"
                  value={filters.minSeats}
                  onChange={(e) => setFilters(prev => ({ ...prev, minSeats: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Sort By</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                >
                  <option value="departureTime">Departure Time</option>
                  <option value="price">Price</option>
                  <option value="rating">Driver Rating</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {loading ? "Loading..." : `${sortedRoutes.length} routes found`}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <SortAsc className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <SortDesc className="h-4 w-4" />
              </Button>
            </div>
          </div>

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
          ) : sortedRoutes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No routes found matching your criteria.</p>
                <Button variant="outline" className="mt-4" onClick={loadRoutes}>
                  View All Routes
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedRoutes.map((route) => (
                <RouteCard key={route.id} route={route} onBook={handleBookRide} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        route={selectedRoute}
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedRoute(null);
        }}
        onSuccess={handleBookingSuccess}
      />
    </div>
  );
}

const RouteCard = ({ route, onBook }: { route: Route; onBook: (route: Route) => void }) => {
  const availableSeats = route.totalSeats - route.bookedSeats;
  const isFull = availableSeats === 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">{route.routeName}</h3>
            <p className="text-sm text-muted-foreground">
              by {route.driverInfo.displayName} • ⭐ {route.driverInfo.rating}
            </p>
          </div>
          <div className="flex gap-2">
            {route.isOfficial && (
              <Badge variant="default">Official</Badge>
            )}
            <Badge variant={isFull ? "destructive" : "secondary"}>
              {isFull ? "Full" : `${availableSeats} seats left`}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">From</p>
              <p className="text-sm text-muted-foreground">{route.startPoint.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">To</p>
              <p className="text-sm text-muted-foreground">{route.endPoint.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Schedule</p>
              <p className="text-sm text-muted-foreground">{route.schedule}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {route.bookedSeats}/{route.totalSeats} booked
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              {route.upvotes} votes
            </span>
          </div>
          <Button 
            onClick={() => onBook(route)} 
            disabled={isFull}
            className="min-w-[120px]"
          >
            {isFull ? "Full" : "Book Ride"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 