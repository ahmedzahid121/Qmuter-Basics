import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { gtfsService, GTFSStop, GTFSStopTrip } from '@/lib/gtfs-service';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Clock, MapPin, ArrowRight, RefreshCw } from 'lucide-react';

interface StopScheduleProps {
  stopId?: string;
  stop?: GTFSStop;
  className?: string;
}

export function StopSchedule({ stopId, stop, className }: StopScheduleProps) {
  const [schedule, setSchedule] = useState<GTFSStopTrip[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('next');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const { toast } = useToast();

  const currentStop = stop || (stopId ? null : null);

  useEffect(() => {
    if (currentStop || stopId) {
      loadSchedule();
    }
  }, [currentStop, stopId, selectedDate, selectedHour]);

  const loadSchedule = async () => {
    if (!currentStop && !stopId) return;

    try {
      setLoading(true);
      const stopIdToUse = currentStop?.stop_id || stopId!;
      
      let trips: GTFSStopTrip[] = [];
      
      if (activeTab === 'next') {
        trips = await gtfsService.getNextDepartures(stopIdToUse, 15);
      } else if (activeTab === 'today') {
        trips = await gtfsService.getTodaySchedule(stopIdToUse, selectedHour, 24);
      } else if (activeTab === 'custom') {
        trips = await gtfsService.getStopTrips(stopIdToUse, selectedDate, selectedHour, 24);
      }

      setSchedule(trips);
    } catch (error) {
      console.error('Failed to load schedule:', error);
      toast({
        title: "Error",
        description: "Failed to load stop schedule",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadSchedule();
  };

  const renderTripRow = (trip: GTFSStopTrip) => {
    const route = schedule.find(t => t.route_id === trip.route_id);
    const isNext = activeTab === 'next';
    
    return (
      <div key={`${trip.trip_id}-${trip.departure_time}`} className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="text-center min-w-[60px]">
            <div className="font-semibold text-lg">
              {gtfsService.formatTime(trip.departure_time)}
            </div>
            <div className="text-xs text-gray-500">
              {trip.arrival_time !== trip.departure_time && 
                `Arr: ${gtfsService.formatTime(trip.arrival_time)}`
              }
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-2xl">
              {gtfsService.getRouteTypeIcon(3)} {/* Default to bus, could be enhanced */}
            </div>
            <div>
              <div className="font-medium">{trip.route_id}</div>
              <div className="text-sm text-gray-600">{trip.trip_headsign}</div>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <Badge variant="secondary" className="text-xs">
            {gtfsService.getDirectionName(trip.direction_id)}
          </Badge>
          <div className="text-xs text-gray-500 mt-1">
            {trip.stop_headsign}
          </div>
        </div>
      </div>
    );
  };

  const renderScheduleList = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Loading schedule...</span>
        </div>
      );
    }

    if (schedule.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          {activeTab === 'next' ? 'No upcoming departures' : 'No trips scheduled'}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {schedule.map(renderTripRow)}
      </div>
    );
  };

  const getStopName = () => {
    if (currentStop) return currentStop.stop_name;
    if (stopId) return `Stop ${stopId}`;
    return 'Unknown Stop';
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {getStopName()}
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          {currentStop && (
            <div className="text-sm text-gray-600">
              {currentStop.stop_code} • {currentStop.stop_lat.toFixed(4)}, {currentStop.stop_lon.toFixed(4)}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="next">Next Departures</TabsTrigger>
              <TabsTrigger value="today">Today's Schedule</TabsTrigger>
              <TabsTrigger value="custom">Custom Time</TabsTrigger>
            </TabsList>
            
            <TabsContent value="next" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Next Departures</h3>
                  <Badge variant="outline">{schedule.length} trips</Badge>
                </div>
                {renderScheduleList()}
              </div>
            </TabsContent>
            
            <TabsContent value="today" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Today's Schedule</h3>
                  <div className="flex items-center gap-2">
                    <select
                      className="text-sm border rounded px-2 py-1"
                      value={selectedHour}
                      onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {i.toString().padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                    <Badge variant="outline">{schedule.length} trips</Badge>
                  </div>
                </div>
                {renderScheduleList()}
              </div>
            </TabsContent>
            
            <TabsContent value="custom" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Custom Schedule</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      className="text-sm border rounded px-2 py-1"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                    <select
                      className="text-sm border rounded px-2 py-1"
                      value={selectedHour}
                      onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {i.toString().padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                    <Badge variant="outline">{schedule.length} trips</Badge>
                  </div>
                </div>
                {renderScheduleList()}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Component for displaying a single stop with schedule
interface StopWithScheduleProps {
  stop: GTFSStop;
  className?: string;
}

export function StopWithSchedule({ stop, className }: StopWithScheduleProps) {
  return (
    <div className={className}>
      <StopSchedule stop={stop} />
    </div>
  );
}

// Component for displaying schedule by stop ID
interface StopScheduleByIdProps {
  stopId: string;
  className?: string;
}

export function StopScheduleById({ stopId, className }: StopScheduleByIdProps) {
  return (
    <div className={className}>
      <StopSchedule stopId={stopId} />
    </div>
  );
} 