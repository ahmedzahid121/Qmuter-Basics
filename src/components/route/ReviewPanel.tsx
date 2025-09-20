import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, DollarSign, MapPin, Zap } from "lucide-react";

interface Route {
  id: number;
  checkpointStopIds: string[];
  stops: string[];
  eta: { min: number; max: number };
  traffic: 'light' | 'medium' | 'heavy';
  distanceKm: number;
  zones: number;
  price: number;
  availableSeats: number | null;
}

interface SearchState {
  origin: any;
  destination: any;
  snappedOrigin: any;
  snappedDestination: any;
}

interface ReviewPanelProps {
  route: Route;
  userRole: 'driver' | 'rider';
  onDriverGoLive: (routeData: any) => void;
  onRiderConfirm: (bookingData: any) => void;
  searchState: SearchState;
}

export default function ReviewPanel({ route, userRole, onDriverGoLive, onRiderConfirm, searchState }: ReviewPanelProps) {
  const [driverData, setDriverData] = useState({
    seatsTotal: 4,
    startTime: 'now',
    scheduledTime: '',
    notes: '',
    price: route.price
  });

  const [riderData, setRiderData] = useState({
    boardStopId: route.checkpointStopIds[0],
    alightStopId: route.checkpointStopIds[route.checkpointStopIds.length - 1]
  });

  const handleDriverSubmit = () => {
    onDriverGoLive(driverData);
  };

  const handleRiderSubmit = () => {
    onRiderConfirm({
      ...riderData,
      price: route.price
    });
  };

  const timeOptions = [
    { value: 'now', label: 'Now' },
    { value: '5min', label: '+5 min' },
    { value: '15min', label: '+15 min' },
    { value: 'schedule', label: 'Later' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            {userRole === 'driver' ? (
              <>
                <Users className="w-5 h-5 text-blue-500" />
                Go Live
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 text-green-500" />
                Confirm Booking
              </>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Route Summary */}
          <div className="p-3 bg-slate-50 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-slate-800">Selected Route</div>
              <Badge className="bg-blue-100 text-blue-800">
                {route.zones} zones
              </Badge>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {route.eta.min}-{route.eta.max} minutes • {route.distanceKm} km
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                ${route.price.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Driver-specific fields */}
          {userRole === 'driver' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="seats">Available Seats</Label>
                <Select
                  value={driverData.seatsTotal.toString()}
                  onValueChange={(value) => setDriverData({...driverData, seatsTotal: parseInt(value)})}
                >
                  <SelectTrigger id="seats">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num} seat{num > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Start Time</Label>
                <div className="grid grid-cols-4 gap-2">
                  {timeOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={driverData.startTime === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDriverData({...driverData, startTime: option.value})}
                      className={`text-xs ${
                        driverData.startTime === option.value 
                          ? "bg-blue-500 hover:bg-blue-600" 
                          : ""
                      }`}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {driverData.startTime === 'schedule' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <Label htmlFor="scheduledTime">Departure Time</Label>
                  <Input
                    id="scheduledTime"
                    type="datetime-local"
                    value={driverData.scheduledTime}
                    onChange={(e) => setDriverData({...driverData, scheduledTime: e.target.value})}
                  />
                </motion.div>
              )}

              <div>
                <Label htmlFor="price">Price (${route.price.toFixed(2)} suggested)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.50"
                  min="0"
                  value={driverData.price}
                  onChange={(e) => setDriverData({...driverData, price: parseFloat(e.target.value)})}
                />
              </div>

              <div>
                <Label htmlFor="notes">Optional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special instructions for riders?"
                  value={driverData.notes}
                  onChange={(e) => setDriverData({...driverData, notes: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Rider-specific fields */}
          {userRole === 'rider' && (
            <div className="space-y-4">
              <div>
                <Label>Board at</Label>
                <Select
                  value={riderData.boardStopId}
                  onValueChange={(value) => setRiderData({...riderData, boardStopId: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {route.stops.map((stop, idx) => (
                      <SelectItem key={idx} value={route.checkpointStopIds[idx]}>
                        {stop}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Alight at</Label>
                <Select
                  value={riderData.alightStopId}
                  onValueChange={(value) => setRiderData({...riderData, alightStopId: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {route.stops.map((stop, idx) => (
                      <SelectItem key={idx} value={route.checkpointStopIds[idx]}>
                        {stop}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {route.availableSeats && route.availableSeats <= 2 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-800 text-sm">
                    <Zap className="w-4 h-4" />
                    Only {route.availableSeats} seat{route.availableSeats === 1 ? '' : 's'} left!
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button
            onClick={userRole === 'driver' ? handleDriverSubmit : handleRiderSubmit}
            className={`w-full ${
              userRole === 'driver'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
            }`}
            disabled={userRole === 'rider' && route.availableSeats === 0}
          >
            {userRole === 'driver' ? 'Go Live' : 'Confirm Seat'}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
