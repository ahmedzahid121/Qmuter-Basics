import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { gtfsService, GTFSRoute } from '@/lib/gtfs-service';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin, Clock, Users } from 'lucide-react';

interface PopularRoutesProps {
  onRouteSelect?: (route: GTFSRoute) => void;
  className?: string;
}

export function PopularRoutes({ onRouteSelect, className }: PopularRoutesProps) {
  const [routes, setRoutes] = useState<{
    popular: GTFSRoute[];
    bus: GTFSRoute[];
    train: GTFSRoute[];
    ferry: GTFSRoute[];
  }>({
    popular: [],
    bus: [],
    train: [],
    ferry: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('popular');
  const { toast } = useToast();

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      
      const [popular, bus, train, ferry] = await Promise.all([
        gtfsService.getPopularRoutes(),
        gtfsService.getRoutesByType(3), // Bus
        gtfsService.getRoutesByType(2), // Train
        gtfsService.getRoutesByType(4)  // Ferry
      ]);

      setRoutes({
        popular: popular.slice(0, 10),
        bus: bus.slice(0, 15),
        train: train.slice(0, 10),
        ferry: ferry.slice(0, 8)
      });
    } catch (error) {
      console.error('Failed to load routes:', error);
      toast({
        title: "Error",
        description: "Failed to load popular routes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRouteClick = (route: GTFSRoute) => {
    if (onRouteSelect) {
      onRouteSelect(route);
    } else {
      toast({
        title: "Route Selected",
        description: `${route.route_short_name} - ${route.route_long_name}`,
      });
    }
  };

  const renderRouteCard = (route: GTFSRoute) => (
    <Card 
      key={route.route_id} 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => handleRouteClick(route)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">
              {gtfsService.getRouteTypeIcon(route.route_type)}
            </div>
            <div>
              <div className="font-semibold text-lg">
                {route.route_short_name}
              </div>
              <div className="text-sm text-gray-600 truncate max-w-[200px]">
                {route.route_long_name}
              </div>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="text-xs">
              {gtfsService.getRouteTypeName(route.route_type)}
            </Badge>
            {route.route_color && (
              <div 
                className="w-4 h-4 rounded-full mt-1 ml-auto"
                style={{ backgroundColor: `#${route.route_color}` }}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderRouteList = (routeList: GTFSRoute[], emptyMessage: string) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Loading routes...</span>
        </div>
      );
    }

    if (routeList.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routeList.map(renderRouteCard)}
      </div>
    );
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Popular Auckland Transport Routes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="popular">Popular</TabsTrigger>
              <TabsTrigger value="bus">Bus</TabsTrigger>
              <TabsTrigger value="train">Train</TabsTrigger>
              <TabsTrigger value="ferry">Ferry</TabsTrigger>
            </TabsList>
            
            <TabsContent value="popular" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Most Popular Routes</h3>
                  <Badge variant="outline">{routes.popular.length} routes</Badge>
                </div>
                {renderRouteList(routes.popular, "No popular routes available")}
              </div>
            </TabsContent>
            
            <TabsContent value="bus" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Bus Routes</h3>
                  <Badge variant="outline">{routes.bus.length} routes</Badge>
                </div>
                {renderRouteList(routes.bus, "No bus routes available")}
              </div>
            </TabsContent>
            
            <TabsContent value="train" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Train Routes</h3>
                  <Badge variant="outline">{routes.train.length} routes</Badge>
                </div>
                {renderRouteList(routes.train, "No train routes available")}
              </div>
            </TabsContent>
            
            <TabsContent value="ferry" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Ferry Routes</h3>
                  <Badge variant="outline">{routes.ferry.length} routes</Badge>
                </div>
                {renderRouteList(routes.ferry, "No ferry routes available")}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Component for displaying route details
interface RouteDetailsProps {
  route: GTFSRoute;
  onClose?: () => void;
}

export function RouteDetails({ route, onClose }: RouteDetailsProps) {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTrips();
  }, [route.route_id]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const routeTrips = await gtfsService.getTripsByRoute(route.route_id);
      setTrips(routeTrips.slice(0, 5)); // Show first 5 trips
    } catch (error) {
      console.error('Failed to load trips:', error);
      toast({
        title: "Error",
        description: "Failed to load route trips",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {gtfsService.getRouteTypeIcon(route.route_type)}
          Route {route.route_short_name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold">{route.route_long_name}</h4>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">
              {gtfsService.getRouteTypeName(route.route_type)}
            </Badge>
            {route.route_color && (
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: `#${route.route_color}` }}
              />
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="ml-2">Loading trips...</span>
          </div>
        ) : trips.length > 0 ? (
          <div>
            <h5 className="font-medium mb-2">Recent Trips</h5>
            <div className="space-y-2">
              {trips.map((trip) => (
                <div key={trip.trip_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{trip.trip_headsign || 'Unknown destination'}</div>
                    <div className="text-sm text-gray-600">Direction: {trip.direction_id === 0 ? 'Outbound' : 'Inbound'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      {trip.wheelchair_accessible === 1 ? '♿' : ''}
                      {trip.bikes_allowed === 1 ? '🚲' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No trips available for this route
          </div>
        )}

        {onClose && (
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 