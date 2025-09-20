"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Phone, MapPin, Clock, User, Shield, CheckCircle, XCircle } from 'lucide-react';

interface EmergencyData {
  rideId: string;
  triggeredBy: 'rider' | 'driver';
  userId: string;
  otherUserId: string;
  location: {
    lat: number;
    lng: number;
  };
  pickupStop: string;
  destinationStop: string;
  timestamp: string;
  status: 'active' | 'resolved';
  userProfile: {
    displayName: string;
    email: string;
    phoneNumber?: string;
  };
  rideMeta: {
    distance: number;
    duration: number;
    zones: string[];
    price: number;
  };
}

interface EmergencyButtonProps {
  rideId: string;
  otherUserId: string;
  pickupStop: string;
  destinationStop: string;
  rideMeta: {
    distance: number;
    duration: number;
    zones: string[];
    price: number;
  };
  className?: string;
}

export function EmergencyButton({ 
  rideId, 
  otherUserId, 
  pickupStop, 
  destinationStop, 
  rideMeta, 
  className 
}: EmergencyButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emergencyId, setEmergencyId] = useState<string | null>(null);

  // Get current location when component mounts
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location Error",
            description: "Unable to get your current location. Emergency services will still be notified.",
            variant: "destructive"
          });
        }
      );
    }
  }, [toast]);

  const triggerEmergency = async () => {
    if (!user || !location) {
      toast({
        title: "Error",
        description: "Unable to trigger emergency. Please try again.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const emergencyData: EmergencyData = {
        rideId,
        triggeredBy: user.role === 'driver' ? 'driver' : 'rider',
        userId: user.uid,
        otherUserId,
        location,
        pickupStop,
        destinationStop,
        timestamp: new Date().toISOString(),
        status: 'active',
        userProfile: {
          displayName: user.displayName || 'Unknown',
          email: user.email || 'Unknown',
          phoneNumber: user.phoneNumber
        },
        rideMeta
      };

      // Send emergency data to backend
      const response = await fetch('/api/emergency/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify(emergencyData)
      });

      if (!response.ok) {
        throw new Error('Failed to trigger emergency');
      }

      const result = await response.json();
      setEmergencyId(result.emergencyId);
      setIsEmergencyActive(true);
      setShowEmergencyDialog(true);

      toast({
        title: "Emergency Triggered",
        description: "Emergency services have been notified. Help is on the way.",
        variant: "destructive"
      });

    } catch (error) {
      console.error('Error triggering emergency:', error);
      toast({
        title: "Emergency Error",
        description: "Failed to trigger emergency. Please call 111 immediately if you're in danger.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resolveEmergency = async () => {
    if (!emergencyId) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/emergency/${emergencyId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });

      if (response.ok) {
        setIsEmergencyActive(false);
        setShowEmergencyDialog(false);
        setShowConfirmationDialog(true);

        toast({
          title: "Emergency Resolved",
          description: "Emergency has been marked as resolved.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error resolving emergency:', error);
      toast({
        title: "Error",
        description: "Failed to resolve emergency. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Emergency Button */}
      <Button
        onClick={triggerEmergency}
        disabled={isLoading || isEmergencyActive}
        className={`bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 ${className}`}
      >
        <AlertTriangle className="mr-2 h-5 w-5" />
        {isLoading ? 'Triggering...' : isEmergencyActive ? 'Emergency Active' : 'EMERGENCY'}
      </Button>

      {/* Emergency Active Dialog */}
      <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Emergency Active
            </DialogTitle>
            <DialogDescription>
              Emergency services have been notified. Your location and ride details have been recorded.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>If you're in immediate danger, call 111 now.</strong>
                <br />
                Emergency services have been notified of your situation.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Emergency Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>Triggered by: {user?.displayName || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>Location: {location?.lat.toFixed(4)}, {location?.lng.toFixed(4)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>Time: {new Date().toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span>Status: <Badge variant="destructive">Active</Badge></span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                onClick={resolveEmergency}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {isLoading ? 'Resolving...' : 'Resolve Emergency'}
              </Button>
              <Button
                onClick={() => setShowEmergencyDialog(false)}
                variant="outline"
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resolution Confirmation Dialog */}
      <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Emergency Resolved
            </DialogTitle>
            <DialogDescription>
              Thank you for confirming your safety. The emergency has been resolved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Emergency resolved successfully.</strong>
                <br />
                If you're still in danger, please call 111 immediately.
              </AlertDescription>
            </Alert>

            <div className="text-sm text-gray-600 space-y-2">
              <p>• Your emergency trigger has been recorded for review</p>
              <p>• No further action is needed if you're safe</p>
              <p>• Contact support if you need assistance</p>
            </div>

            <Button
              onClick={() => setShowConfirmationDialog(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 