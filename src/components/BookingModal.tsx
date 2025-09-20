"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  CreditCard,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Route } from "@/types";

interface BookingModalProps {
  route: Route | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BookingModal({ route, isOpen, onClose, onSuccess }: BookingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [pickupPoint, setPickupPoint] = useState("");
  const [dropoffPoint, setDropoffPoint] = useState("");

  if (!route) return null;

  const availableSeats = route.totalSeats - route.bookedSeats;
  const estimatedPrice = selectedSeats * 5; // TODO: Get actual price from route
  const walletBalance = user?.walletBalance || 0;
  const canAfford = walletBalance >= estimatedPrice;

  const handleBooking = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to book a ride."
      });
      return;
    }

    if (!canAfford) {
      toast({
        variant: "destructive",
        title: "Insufficient Funds",
        description: "Please top up your wallet to book this ride."
      });
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
      
      // Mock booking data
      const bookingData = {
        routeId: route.id,
        passengerId: user.uid,
        seats: selectedSeats,
        pickupPoint,
        dropoffPoint,
        totalPrice: estimatedPrice,
        status: 'confirmed'
      };

      console.log('Booking data:', bookingData);

      toast({
        title: "Booking Confirmed! 🎉",
        description: `You've successfully booked ${selectedSeats} seat(s) on ${route.routeName}.`
      });

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: "Something went wrong. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Book Your Ride</DialogTitle>
          <DialogDescription>
            Confirm your booking details and complete your reservation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Route Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{route.routeName}</span>
                <Badge variant={route.isOfficial ? "default" : "secondary"}>
                  {route.isOfficial ? "Official" : "Community"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {route.schedule}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {route.bookedSeats}/{route.totalSeats} booked
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  {route.driverInfo.rating} rating
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Booking Options */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Number of Seats</label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4].map(num => (
                    <Button
                      key={num}
                      variant={selectedSeats === num ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedSeats(num)}
                      disabled={num > availableSeats}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {availableSeats} seats available
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Pickup Point</label>
                  <input
                    type="text"
                    placeholder="Enter pickup location"
                    value={pickupPoint}
                    onChange={(e) => setPickupPoint(e.target.value)}
                    className="w-full p-2 border rounded-md mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Drop-off Point</label>
                  <input
                    type="text"
                    placeholder="Enter drop-off location"
                    value={dropoffPoint}
                    onChange={(e) => setDropoffPoint(e.target.value)}
                    className="w-full p-2 border rounded-md mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Seats × ${5}</span>
                <span>${selectedSeats * 5}</span>
              </div>
              <div className="flex justify-between items-center font-semibold">
                <span>Total</span>
                <span>${estimatedPrice}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span>Wallet Balance</span>
                <span className={canAfford ? "text-green-600" : "text-red-600"}>
                  ${walletBalance.toFixed(2)}
                </span>
              </div>

              {!canAfford && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">
                    Insufficient wallet balance. Please top up your wallet.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleBooking} 
            disabled={loading || !canAfford || selectedSeats > availableSeats}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Booking...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm Booking
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 