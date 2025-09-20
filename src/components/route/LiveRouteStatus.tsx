import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, QrCode, Users, MapPin, Clock, DollarSign, CheckCircle } from "lucide-react";

interface Route {
  id: string;
  seatsTotal: number;
  etaMin: number;
  distanceKm: number;
  price: number;
  stops: string[];
}

interface LiveRouteStatusProps {
  route: Route;
  onEndRoute: () => void;
}

export default function LiveRouteStatus({ route, onEndRoute }: LiveRouteStatusProps) {
  const [seatsBooked, setSeatsBooked] = useState(0);
  const [routeStarted, setRouteStarted] = useState(false);

  useEffect(() => {
    // Simulate bookings coming in
    const interval = setInterval(() => {
      setSeatsBooked(prev => {
        if (prev < route.seatsTotal) {
          return prev + 1;
        }
        return prev;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [route.seatsTotal]);

  const seatsFree = route.seatsTotal - seatsBooked;

  return (
    <div className="space-y-6">
      {/* Live Status Badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <Badge className="bg-green-500 text-white px-6 py-2 text-lg font-medium">
          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
          LIVE ROUTE
        </Badge>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Route Details */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                Route Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="font-medium">Route Stops</div>
                <div className="flex flex-wrap gap-2">
                  {route.stops.map((stop, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {stop}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <Clock className="w-4 h-4 mx-auto mb-1 text-slate-500" />
                  <div className="font-medium">{route.etaMin} min</div>
                </div>
                <div className="text-center">
                  <MapPin className="w-4 h-4 mx-auto mb-1 text-slate-500" />
                  <div className="font-medium">{route.distanceKm} km</div>
                </div>
                <div className="text-center">
                  <DollarSign className="w-4 h-4 mx-auto mb-1 text-slate-500" />
                  <div className="font-medium">${route.price.toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Seat Management */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-500" />
                Seat Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {seatsFree}
                </div>
                <div className="text-sm text-slate-600">
                  {seatsFree === 1 ? 'seat' : 'seats'} available
                </div>
              </div>
              
              <div className="flex justify-center gap-1">
                {[...Array(route.seatsTotal)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-xs font-medium ${
                      i < seatsBooked
                        ? 'bg-green-100 border-green-400 text-green-700'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    {i < seatsBooked ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                ))}
              </div>

              <div className="text-xs text-center text-slate-500">
                {seatsBooked} of {route.seatsTotal} seats booked
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button variant="outline" className="flex-1" size="sm">
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button variant="outline" className="flex-1" size="sm">
                <QrCode className="w-4 h-4 mr-1" />
                QR Code
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      {/* Route Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">Route Control</h3>
                <p className="text-sm text-slate-600">
                  {routeStarted ? 'Route in progress' : 'Ready to start your route'}
                </p>
              </div>
              <div className="flex gap-3">
                {!routeStarted ? (
                  <Button
                    onClick={() => setRouteStarted(true)}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    Start Route
                  </Button>
                ) : (
                  <Button
                    onClick={onEndRoute}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    End Route
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
