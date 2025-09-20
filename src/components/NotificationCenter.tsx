import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Clock, MapPin, Car, User, CheckCircle, AlertCircle, X } from 'lucide-react';

interface Notification {
  id: string;
  type: 'driver-eta' | 'rider-eta' | 'arrival-notification' | 'route-approved' | 'route-rejected' | 'booking-confirmed' | 'ride-reminder' | 'payment-received';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: number;
}

export function NotificationCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch('/api/v1/notifications', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setNotifications(result.data);
          setUnreadCount(result.data.filter((n: Notification) => !n.read).length);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/v1/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/v1/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        toast({
          title: 'Notifications',
          description: 'All notifications marked as read',
        });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'driver-eta':
        return <Car className="h-4 w-4 text-blue-600" />;
      case 'rider-eta':
        return <User className="h-4 w-4 text-green-600" />;
      case 'arrival-notification':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'route-approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'route-rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'booking-confirmed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'ride-reminder':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'payment-received':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get notification color
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'driver-eta':
        return 'border-l-blue-500 bg-blue-50';
      case 'rider-eta':
        return 'border-l-green-500 bg-green-50';
      case 'arrival-notification':
        return 'border-l-green-500 bg-green-50';
      case 'route-approved':
        return 'border-l-green-500 bg-green-50';
      case 'route-rejected':
        return 'border-l-red-500 bg-red-50';
      case 'booking-confirmed':
        return 'border-l-blue-500 bg-blue-50';
      case 'ride-reminder':
        return 'border-l-orange-500 bg-orange-50';
      case 'payment-received':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Handle different notification types
    switch (notification.type) {
      case 'driver-eta':
      case 'rider-eta':
      case 'arrival-notification':
        // Navigate to live tracking
        if (notification.data?.tripId) {
          // You can implement navigation here
          console.log('Navigate to trip:', notification.data.tripId);
        }
        break;
      case 'route-approved':
      case 'route-rejected':
        // Navigate to routes
        console.log('Navigate to routes');
        break;
      case 'booking-confirmed':
        // Navigate to bookings
        console.log('Navigate to bookings');
        break;
      default:
        break;
    }
  };

  // Poll for new notifications
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border z-50">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notifications</CardTitle>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-sm text-gray-500">Loading notifications...</div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <div className="text-sm text-gray-500">No notifications</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-3 rounded-lg border-l-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                          getNotificationColor(notification.type)
                        } ${!notification.read ? 'bg-opacity-100' : 'bg-opacity-50'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`text-sm font-medium ${
                                !notification.read ? 'text-gray-900' : 'text-gray-600'
                              }`}>
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {formatTimestamp(notification.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 