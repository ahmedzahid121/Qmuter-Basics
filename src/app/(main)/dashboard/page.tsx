
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { usePWA } from "@/components/PWAInstallPrompt";
import { apiService } from "@/lib/api";
import { 
  Users, 
  Car, 
  DollarSign, 
  TrendingUp, 
  MapPin,
  Clock,
  Calendar,
  Activity,
  Plus,
  Search,
  Filter,
  Star
} from "lucide-react";

interface Route {
  id: string;
  driverName: string;
  pickup: string;
  destination: string;
  departureTime: string;
  price: number;
  availableSeats: number;
  rating: number;
  status: 'active' | 'pending' | 'completed';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isPWA, isOnline } = usePWA();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("discover");

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      
      // Real API call to backend
      const response = await apiService.getRoutes({ status: 'active' });
      
      if (response.success && response.data) {
        setRoutes(response.data);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to load routes",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load routes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-NZ', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="mobile-container py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading routes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container py-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="mobile-text-2xl font-bold text-gray-900">
              Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-gray-600 mt-1">
              {isOnline ? 'Find your perfect ride' : 'Offline mode - limited features'}
            </p>
          </div>
          {!isPWA && (
            <Badge variant="outline" className="text-xs">
              📱 Install App
            </Badge>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="mobile-card">
            <CardContent className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">12</div>
                <div className="text-xs text-gray-600">Available Routes</div>
              </div>
            </CardContent>
          </Card>
          <Card className="mobile-card">
            <CardContent className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">5</div>
                <div className="text-xs text-gray-600">My Rides</div>
              </div>
            </CardContent>
          </Card>
          <Card className="mobile-card">
            <CardContent className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">$45</div>
                <div className="text-xs text-gray-600">Saved</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="my-rides">My Rides</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
        </TabsList>

        {/* Discover Tab */}
        <TabsContent value="discover" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search routes..."
                className="mobile-input pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Routes List */}
          <div className="space-y-4">
            {routes.map((route) => (
              <Card key={route.id} className="mobile-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{route.driverName}</h3>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-gray-600">{route.rating}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span className="text-gray-700">{route.pickup}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-red-600" />
                          <span className="text-gray-700">{route.destination}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {formatPrice(route.price)}
                      </div>
                      <div className="text-xs text-gray-600">
                        {route.availableSeats} seat{route.availableSeats !== 1 ? 's' : ''} left
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(route.departureTime)}</span>
                    </div>
                    
                    <Button className="mobile-btn-primary">
                      <Plus className="mr-2 h-4 w-4" />
                      Join Ride
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* My Rides Tab */}
        <TabsContent value="my-rides" className="space-y-4">
          <div className="text-center py-8">
            <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No rides yet</h3>
            <p className="text-gray-600 mb-4">Join a ride to see it here</p>
            <Button className="mobile-btn-primary">
              <Search className="mr-2 h-4 w-4" />
              Find Rides
            </Button>
          </div>
        </TabsContent>

        {/* Saved Tab */}
        <TabsContent value="saved" className="space-y-4">
          <div className="text-center py-8">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved routes</h3>
            <p className="text-gray-600">Save routes you like for quick access</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      {user && (
        <div className="fixed bottom-24 right-4 z-40">
          <Button
            size="icon"
            className="w-14 h-14 rounded-full shadow-lg bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
}
