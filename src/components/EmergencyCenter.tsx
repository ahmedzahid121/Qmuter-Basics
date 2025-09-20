"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Eye, 
  CheckCircle, 
  MessageSquare,
  TrendingUp,
  Shield,
  Activity
} from 'lucide-react';

interface EmergencyData {
  id: string;
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
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

interface AdminLog {
  id: string;
  adminId: string;
  emergencyId: string;
  action: string;
  notes?: string;
  timestamp: string;
}

export function EmergencyCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [emergencies, setEmergencies] = useState<EmergencyData[]>([]);
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyData | null>(null);
  const [emergencyLogs, setEmergencyLogs] = useState<AdminLog[]>([]);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadEmergencies();
      // Set up real-time updates
      const interval = setInterval(loadEmergencies, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadEmergencies = async () => {
    try {
      const response = await fetch('/api/admin/emergencies', {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEmergencies(data.data);
        setActiveCount(data.data.filter((e: EmergencyData) => e.status === 'active').length);
      }
    } catch (error) {
      console.error('Error loading emergencies:', error);
      toast({
        title: "Error",
        description: "Failed to load emergency data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEmergencyLogs = async (emergencyId: string) => {
    try {
      const response = await fetch(`/api/admin/emergencies/${emergencyId}/logs`, {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEmergencyLogs(data.data);
      }
    } catch (error) {
      console.error('Error loading emergency logs:', error);
    }
  };

  const viewEmergencyDetails = async (emergency: EmergencyData) => {
    setSelectedEmergency(emergency);
    await loadEmergencyLogs(emergency.id);
    setShowDetailsDialog(true);
  };

  const performAction = async (action: string) => {
    if (!selectedEmergency) return;

    try {
      const response = await fetch(`/api/admin/emergencies/${selectedEmergency.id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({
          action,
          notes: actionNotes
        })
      });

      if (response.ok) {
        toast({
          title: "Action Recorded",
          description: `Admin action '${action}' has been recorded`,
          variant: "default"
        });
        setShowActionDialog(false);
        setActionNotes('');
        setSelectedAction('');
        await loadEmergencyLogs(selectedEmergency.id);
      }
    } catch (error) {
      console.error('Error performing action:', error);
      toast({
        title: "Error",
        description: "Failed to record action",
        variant: "destructive"
      });
    }
  };

  const resolveEmergency = async (emergencyId: string) => {
    try {
      const response = await fetch(`/api/admin/emergencies/${emergencyId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({
          action: 'resolve',
          notes: 'Emergency resolved by admin'
        })
      });

      if (response.ok) {
        toast({
          title: "Emergency Resolved",
          description: "Emergency has been marked as resolved",
          variant: "default"
        });
        await loadEmergencies();
      }
    } catch (error) {
      console.error('Error resolving emergency:', error);
      toast({
        title: "Error",
        description: "Failed to resolve emergency",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'destructive' : 'default';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading emergency data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Emergency Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Emergencies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{activeCount}</div>
            <p className="text-xs text-muted-foreground">
              {activeCount > 0 ? 'Requires immediate attention' : 'All clear'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emergencies</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emergencies.length}</div>
            <p className="text-xs text-muted-foreground">
              All time emergency triggers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {emergencies.length > 0 ? Math.round(((emergencies.length - activeCount) / emergencies.length) * 100) : 100}%
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully resolved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Emergency Alert */}
      {activeCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>🚨 {activeCount} Active Emergency{activeCount > 1 ? 's' : ''}</strong>
            <br />
            Immediate attention required. Review and take action on active emergencies.
          </AlertDescription>
        </Alert>
      )}

      {/* Emergencies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Triggered By</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Ride Details</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emergencies.map((emergency) => (
                  <TableRow key={emergency.id}>
                    <TableCell>
                      <Badge variant={getStatusColor(emergency.status)}>
                        {emergency.status === 'active' ? 'Active' : 'Resolved'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="capitalize">{emergency.triggeredBy}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">
                          {emergency.location.lat.toFixed(4)}, {emergency.location.lng.toFixed(4)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div><strong>Route:</strong> {emergency.pickupStop} → {emergency.destinationStop}</div>
                        <div><strong>Distance:</strong> {emergency.rideMeta.distance}km</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{formatDate(emergency.timestamp)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewEmergencyDetails(emergency)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {emergency.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resolveEmergency(emergency.id)}
                            className="text-green-600"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Emergency Details
            </DialogTitle>
            <DialogDescription>
              Complete emergency information and action history
            </DialogDescription>
          </DialogHeader>

          {selectedEmergency && (
            <div className="space-y-6">
              {/* Emergency Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Emergency Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      <Badge variant={getStatusColor(selectedEmergency.status)}>
                        {selectedEmergency.status === 'active' ? 'Active' : 'Resolved'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Triggered By:</span>
                      <span className="capitalize">{selectedEmergency.triggeredBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Ride ID:</span>
                      <span className="font-mono text-sm">{selectedEmergency.rideId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Time:</span>
                      <span>{formatDate(selectedEmergency.timestamp)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Location:</span>
                      <span className="text-sm">
                        {selectedEmergency.location.lat.toFixed(4)}, {selectedEmergency.location.lng.toFixed(4)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">User Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{selectedEmergency.userProfile.displayName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{selectedEmergency.userProfile.email}</span>
                    </div>
                    {selectedEmergency.userProfile.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{selectedEmergency.userProfile.phoneNumber}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Ride Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ride Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="font-medium mb-2">Route</div>
                      <div className="text-sm">
                        <div><strong>From:</strong> {selectedEmergency.pickupStop}</div>
                        <div><strong>To:</strong> {selectedEmergency.destinationStop}</div>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium mb-2">Trip Information</div>
                      <div className="text-sm">
                        <div><strong>Distance:</strong> {selectedEmergency.rideMeta.distance}km</div>
                        <div><strong>Duration:</strong> {selectedEmergency.rideMeta.duration}min</div>
                        <div><strong>Price:</strong> ${selectedEmergency.rideMeta.price}</div>
                        <div><strong>Zones:</strong> {selectedEmergency.rideMeta.zones.join(', ')}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Action History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {emergencyLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{log.action}</Badge>
                          <span className="text-sm">{log.notes}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setSelectedAction('contact');
                    setShowActionDialog(true);
                  }}
                  variant="outline"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contact User
                </Button>
                <Button
                  onClick={() => {
                    setSelectedAction('escalate');
                    setShowActionDialog(true);
                  }}
                  variant="outline"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Escalate
                </Button>
                {selectedEmergency.status === 'active' && (
                  <Button
                    onClick={() => resolveEmergency(selectedEmergency.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Resolve Emergency
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Admin Action</DialogTitle>
            <DialogDescription>
              Record your action for audit purposes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Action Type</label>
              <div className="text-sm text-muted-foreground capitalize">
                {selectedAction}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Enter details about your action..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => performAction(selectedAction)}
                className="flex-1"
              >
                Record Action
              </Button>
              <Button
                onClick={() => setShowActionDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 