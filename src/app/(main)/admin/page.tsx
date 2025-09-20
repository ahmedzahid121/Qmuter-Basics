"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Car, 
  DollarSign, 
  BarChart, 
  User as UserIcon, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  MapPin,
  Clock,
  Calendar,
  Activity,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MoreHorizontal
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { EmergencyCenter } from "@/components/EmergencyCenter";

// Types for admin data
interface AdminStats {
  totalUsers: number;
  totalRides: number;
  totalRevenue: number;
  ridesThisMonth: number;
  activeRoutes: number;
  pendingRoutes: number;
  totalProfit: number;
  platformFee: number;
  averageRideValue: number;
  userGrowth: number;
  revenueGrowth: number;
}

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: 'driver' | 'passenger' | 'admin';
  totalRides: number;
  totalCO2Saved: number;
  totalMoneySaved: number;
  walletBalance: number;
  badgeTier: string;
  createdAt: string;
  lastActive: string;
  isSuspended: boolean;
}

interface RouteData {
  id: string;
  routeName: string;
  driverId: string;
  driverName: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
  totalSeats: number;
  pricePerSeat: number;
  totalRides: number;
  totalRevenue: number;
  communityScore: number;
  createdAt: string;
  upvotes: number;
  downvotes: number;
}

interface TransactionData {
  id: string;
  userId: string;
  userEmail: string;
  type: 'ride_payment' | 'wallet_topup' | 'refund' | 'platform_fee';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  createdAt: string;
  platformFee: number;
}

interface AlertData {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

interface AnalyticsData {
  ridesByDay: { date: string; rides: number }[];
  revenueByDay: { date: string; revenue: number }[];
  popularRoutes: { routeName: string; rides: number }[];
  userActivity: { hour: number; users: number }[];
  topDrivers: { name: string; rides: number; revenue: number }[];
  topPassengers: { name: string; rides: number; savings: number }[];
}

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (user?.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard.",
        variant: "destructive",
      });
      return;
    }

    loadAdminData();
  }, [user]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Load all admin data in parallel
      const [statsRes, usersRes, routesRes, transactionsRes, alertsRes, analyticsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
        fetch('/api/admin/routes'),
        fetch('/api/admin/transactions'),
        fetch('/api/admin/alerts'),
        fetch('/api/admin/analytics')
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (routesRes.ok) setRoutes(await routesRes.json());
      if (transactionsRes.ok) setTransactions(await transactionsRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());

    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'active': return 'default';
      case 'approved': return 'default';
      case 'pending': return 'outline';
      case 'inactive': return 'secondary';
      case 'rejected': return 'destructive';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl p-4 space-y-8 pb-24">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-4 space-y-8 pb-24">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive analytics and management for Qmuter platform.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadAdminData} variant="outline">
            <Activity className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
          <Button asChild variant="outline">
            <Link href="/profile">
              <UserIcon className="mr-2 h-4 w-4" />
              View My Profile
            </Link>
          </Button>
        </div>
      </header>

      {/* Alerts Section */}
      {alerts.filter(alert => !alert.isRead).length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {alerts.filter(alert => !alert.isRead).length} unread alerts. 
            <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("alerts")}>
              View all alerts
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="emergencies">Emergency</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers.toLocaleString()}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {stats?.userGrowth && stats.userGrowth > 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  {Math.abs(stats?.userGrowth || 0)}% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalRides.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  {stats?.ridesThisMonth} this month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {stats?.revenueGrowth && stats.revenueGrowth > 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  {Math.abs(stats?.revenueGrowth || 0)}% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats?.totalProfit || 0)}</div>
                <div className="text-xs text-muted-foreground">
                  {stats?.platformFee}% platform fee
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Routes</CardTitle>
                <CardDescription>Currently active routes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats?.activeRoutes}</div>
                <div className="text-sm text-muted-foreground mt-2">
                  {stats?.pendingRoutes} pending approval
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Average Ride Value</CardTitle>
                <CardDescription>Average revenue per ride</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(stats?.averageRideValue || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Platform Performance</CardTitle>
                <CardDescription>Revenue growth this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Revenue Growth</span>
                    <span className={stats?.revenueGrowth && stats.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                      {stats?.revenueGrowth}%
                    </span>
                  </div>
                  <Progress value={Math.abs(stats?.revenueGrowth || 0)} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest financial activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <div>
                          <p className="text-sm font-medium">{transaction.userEmail}</p>
                          <p className="text-xs text-muted-foreground">{transaction.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(transaction.amount)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(transaction.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Routes</CardTitle>
                <CardDescription>Most used routes this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.popularRoutes.slice(0, 5).map((route, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{route.routeName}</p>
                          <p className="text-xs text-muted-foreground">{route.rides} rides</p>
                        </div>
                      </div>
                      <Badge variant="outline">{route.rides} rides</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage all registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Rides</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.uid}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.displayName || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.totalRides}</TableCell>
                        <TableCell>{formatCurrency(user.walletBalance)}</TableCell>
                        <TableCell>
                          <Badge variant={user.isSuspended ? 'destructive' : 'default'}>
                            {user.isSuspended ? 'Suspended' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Routes Tab */}
        <TabsContent value="routes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Route Management</CardTitle>
              <CardDescription>All routes and their performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route Name</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routes.map((route) => (
                      <TableRow key={route.id}>
                        <TableCell className="font-medium">{route.routeName}</TableCell>
                        <TableCell>{route.driverName}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(route.status)}>
                            {route.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(route.totalRevenue)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{route.communityScore}</span>
                            <div className="flex space-x-1">
                              <span className="text-green-500">↑{route.upvotes}</span>
                              <span className="text-red-500">↓{route.downvotes}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(route.createdAt)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>All financial transactions and platform fees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Platform Fee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.userEmail}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{transaction.type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>{formatCurrency(transaction.platformFee)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Drivers</CardTitle>
                <CardDescription>Most active drivers by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.topDrivers.slice(0, 5).map((driver, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-green-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{driver.name}</p>
                          <p className="text-xs text-muted-foreground">{driver.rides} rides</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(driver.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Passengers</CardTitle>
                <CardDescription>Most active passengers by savings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.topPassengers.slice(0, 5).map((passenger, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{passenger.name}</p>
                          <p className="text-xs text-muted-foreground">{passenger.rides} rides</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(passenger.savings)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Emergency Center Tab */}
        <TabsContent value="emergencies" className="space-y-6">
          <EmergencyCenter />
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Important notifications and warnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <Alert key={alert.id} variant={alert.type === 'error' ? 'destructive' : 'default'}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-sm">{alert.message}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(alert.createdAt)}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
