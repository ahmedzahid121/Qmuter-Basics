import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User, Car, CheckCircle, AlertTriangle } from "lucide-react";

interface RouteInstance {
  stops: string[];
  etaMin: number;
  price: number;
}

interface Booking {
  id: string;
  status: 'HELD' | 'CONFIRMED';
  routeInstance: RouteInstance;
  boardStopId: string;
  alightStopId: string;
}

interface BookingStatusProps {
  booking: Booking;
  onCancel: () => void;
}

export default function BookingStatus({ booking, onCancel }: BookingStatusProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (booking.status === 'CONFIRMED') {
      setConfirmed(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setConfirmed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [booking.status]);

  return (
    <div className="space-y-6">
      {/* Status Badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <Badge className={`px-6 py-2 text-lg font-medium ${
          confirmed 
            ? 'bg-green-500 text-white' 
            : 'bg-orange-500 text-white'
        }`}>
          {confirmed ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              BOOKING CONFIRMED
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              HOLDING SEAT
            </>
          )}
        </Badge>
      </motion.div>

      {!confirmed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-2 text-orange-800">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">
                  Holding your seat... <strong>{timeLeft}s</strong> left to confirm
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Booking Details */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                Your Journey
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="font-medium text-green-800">Board at</div>
                    <div className="text-sm text-green-600">
                      {booking.routeInstance.stops[0]} • Platform 2
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div>
                    <div className="font-medium text-red-800">Alight at</div>
                    <div className="text-sm text-red-600">
                      {booking.routeInstance.stops[booking.routeInstance.stops.length - 1]}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t text-center">
                <div>
                  <Clock className="w-4 h-4 mx-auto mb-1 text-slate-500" />
                  <div className="font-medium text-sm">
                    {booking.routeInstance.etaMin} min
                  </div>
                </div>
                <div>
                  <span className="text-lg font-bold text-green-600">
                    ${booking.routeInstance.price.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Driver Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-green-500" />
                Your Driver
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">JD</span>
                </div>
                <div>
                  <div className="font-medium">John Driver</div>
                  <div className="text-sm text-slate-600">4.9 ★ • 120 trips</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Car className="w-4 h-4 text-slate-500" />
                  <span>Blue Honda Civic • ABC123</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Arrives in 3 minutes</span>
                </div>
              </div>

              {confirmed && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm text-green-800 font-medium">
                    Driver has been notified of your booking!
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">
                  {confirmed ? 'Booking Confirmed' : 'Secure Your Seat'}
                </h3>
                <p className="text-sm text-slate-600">
                  {confirmed 
                    ? 'Meet your driver at the pickup location' 
                    : 'Complete payment to confirm your seat'
                  }
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  Cancel Booking
                </Button>
                {!confirmed && (
                  <Button className="bg-green-500 hover:bg-green-600">
                    Pay & Confirm
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
