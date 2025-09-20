"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const joi_1 = __importDefault(require("joi"));
const firebase_1 = require("../config/firebase");
const firestore_1 = require("firebase-admin/firestore");
const router = express_1.default.Router();
// Admin authorization middleware
const requireAdmin = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }
        next();
    }
    catch (error) {
        res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }
};
// Get comprehensive admin statistics
router.get('/stats', auth_1.authenticateUser, requireAdmin, async (req, res) => {
    try {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        // Get all users
        const usersSnapshot = await firebase_1.db.collection('users').get();
        const totalUsers = usersSnapshot.size;
        // Get user growth (users created this month vs last month)
        const thisMonthUsers = usersSnapshot.docs.filter(doc => {
            var _a;
            const userData = doc.data();
            return ((_a = userData.createdAt) === null || _a === void 0 ? void 0 : _a.toDate()) >= thisMonth;
        }).length;
        const lastMonthUsers = usersSnapshot.docs.filter(doc => {
            var _a, _b;
            const userData = doc.data();
            return ((_a = userData.createdAt) === null || _a === void 0 ? void 0 : _a.toDate()) >= lastMonth && ((_b = userData.createdAt) === null || _b === void 0 ? void 0 : _b.toDate()) < thisMonth;
        }).length;
        const userGrowth = lastMonthUsers > 0 ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 : 0;
        // Get all routes
        const routesSnapshot = await firebase_1.db.collection('routes').get();
        const routes = routesSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        const activeRoutes = routes.filter(route => route.status === 'active').length;
        const pendingRoutes = routes.filter(route => route.status === 'pending').length;
        // Get all transactions
        const transactionsSnapshot = await firebase_1.db.collection('transactions').get();
        const transactions = transactionsSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        const totalRevenue = transactions
            .filter(t => t.status === 'completed' && t.type === 'ride_payment')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalProfit = transactions
            .filter(t => t.status === 'completed' && t.type === 'platform_fee')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        // Get rides this month
        const ridesThisMonth = transactions
            .filter(t => {
            var _a;
            return t.status === 'completed' && t.type === 'ride_payment' &&
                ((_a = t.createdAt) === null || _a === void 0 ? void 0 : _a.toDate()) >= thisMonth;
        })
            .length;
        // Get total rides
        const totalRides = transactions
            .filter(t => t.status === 'completed' && t.type === 'ride_payment')
            .length;
        // Calculate average ride value
        const averageRideValue = totalRides > 0 ? totalRevenue / totalRides : 0;
        // Get revenue growth
        const thisMonthRevenue = transactions
            .filter(t => {
            var _a;
            return t.status === 'completed' && t.type === 'ride_payment' &&
                ((_a = t.createdAt) === null || _a === void 0 ? void 0 : _a.toDate()) >= thisMonth;
        })
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        const lastMonthRevenue = transactions
            .filter(t => {
            var _a, _b;
            return t.status === 'completed' && t.type === 'ride_payment' &&
                ((_a = t.createdAt) === null || _a === void 0 ? void 0 : _a.toDate()) >= lastMonth && ((_b = t.createdAt) === null || _b === void 0 ? void 0 : _b.toDate()) < thisMonth;
        })
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        const revenueGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
        const stats = {
            totalUsers,
            totalRides,
            totalRevenue,
            ridesThisMonth,
            activeRoutes,
            pendingRoutes,
            totalProfit,
            platformFee: 10, // 10% platform fee
            averageRideValue,
            userGrowth,
            revenueGrowth
        };
        res.json(stats);
    }
    catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch admin statistics'
        });
    }
});
// Get all users with detailed information
router.get('/users', auth_1.authenticateUser, requireAdmin, async (req, res) => {
    try {
        const usersSnapshot = await firebase_1.db.collection('users').get();
        const users = usersSnapshot.docs.map(doc => {
            var _a, _b;
            const data = doc.data();
            return {
                uid: doc.id,
                email: data.email,
                displayName: data.displayName,
                role: data.role || 'passenger',
                totalRides: data.totalRides || 0,
                totalCO2Saved: data.totalCO2Saved || 0,
                totalMoneySaved: data.totalMoneySaved || 0,
                walletBalance: data.walletBalance || 0,
                badgeTier: data.badgeTier || 'Bronze',
                createdAt: ((_a = data.createdAt) === null || _a === void 0 ? void 0 : _a.toDate().toISOString()) || new Date().toISOString(),
                lastActive: ((_b = data.lastActive) === null || _b === void 0 ? void 0 : _b.toDate().toISOString()) || new Date().toISOString(),
                isSuspended: data.isSuspended || false
            };
        });
        res.json(users);
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
});
// Get all routes with performance data
router.get('/routes', auth_1.authenticateUser, requireAdmin, async (req, res) => {
    try {
        const routesSnapshot = await firebase_1.db.collection('routes').get();
        const routes = await Promise.all(routesSnapshot.docs.map(async (doc) => {
            var _a;
            const data = doc.data();
            // Get driver information
            let driverName = 'Unknown';
            try {
                const driverDoc = await firebase_1.db.collection('users').doc(data.driverId).get();
                if (driverDoc.exists) {
                    const driverData = driverDoc.data();
                    driverName = (driverData === null || driverData === void 0 ? void 0 : driverData.displayName) || (driverData === null || driverData === void 0 ? void 0 : driverData.email) || 'Unknown';
                }
            }
            catch (error) {
                console.error('Error fetching driver info:', error);
            }
            // Calculate total revenue for this route
            const transactionsSnapshot = await firebase_1.db.collection('transactions')
                .where('routeId', '==', doc.id)
                .where('status', '==', 'completed')
                .get();
            const totalRevenue = transactionsSnapshot.docs.reduce((sum, t) => {
                const transactionData = t.data();
                return sum + (transactionData.amount || 0);
            }, 0);
            // Count total rides for this route
            const totalRides = transactionsSnapshot.size;
            return {
                id: doc.id,
                routeName: data.routeName,
                driverId: data.driverId,
                driverName,
                status: data.status,
                totalSeats: data.totalSeats,
                pricePerSeat: data.pricePerSeat,
                totalRides,
                totalRevenue,
                communityScore: data.communityScore || 0,
                createdAt: ((_a = data.createdAt) === null || _a === void 0 ? void 0 : _a.toDate().toISOString()) || new Date().toISOString(),
                upvotes: data.upvotes || 0,
                downvotes: data.downvotes || 0
            };
        }));
        res.json(routes);
    }
    catch (error) {
        console.error('Error fetching routes:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch routes'
        });
    }
});
// Get all transactions
router.get('/transactions', auth_1.authenticateUser, requireAdmin, async (req, res) => {
    try {
        const transactionsSnapshot = await firebase_1.db.collection('transactions')
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();
        const transactions = await Promise.all(transactionsSnapshot.docs.map(async (doc) => {
            var _a;
            const data = doc.data();
            // Get user information
            let userEmail = 'Unknown';
            try {
                const userDoc = await firebase_1.db.collection('users').doc(data.userId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    userEmail = (userData === null || userData === void 0 ? void 0 : userData.email) || 'Unknown';
                }
            }
            catch (error) {
                console.error('Error fetching user info:', error);
            }
            return {
                id: doc.id,
                userId: data.userId,
                userEmail,
                type: data.type,
                amount: data.amount || 0,
                currency: data.currency || 'NZD',
                status: data.status,
                description: data.description,
                createdAt: ((_a = data.createdAt) === null || _a === void 0 ? void 0 : _a.toDate().toISOString()) || new Date().toISOString(),
                platformFee: data.platformFee || 0
            };
        }));
        res.json(transactions);
    }
    catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch transactions'
        });
    }
});
// Get system alerts
router.get('/alerts', auth_1.authenticateUser, requireAdmin, async (req, res) => {
    try {
        const alertsSnapshot = await firebase_1.db.collection('admin_alerts')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        const alerts = alertsSnapshot.docs.map(doc => {
            var _a;
            const data = doc.data();
            return {
                id: doc.id,
                type: data.type || 'info',
                title: data.title,
                message: data.message,
                createdAt: ((_a = data.createdAt) === null || _a === void 0 ? void 0 : _a.toDate().toISOString()) || new Date().toISOString(),
                isRead: data.isRead || false
            };
        });
        res.json(alerts);
    }
    catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch alerts'
        });
    }
});
// Get analytics data
router.get('/analytics', auth_1.authenticateUser, requireAdmin, async (req, res) => {
    try {
        const now = new Date();
        const last30Days = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        // Get rides by day for the last 30 days
        const ridesByDay = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
            const dateStr = date.toISOString().split('T')[0];
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            const ridesSnapshot = await firebase_1.db.collection('transactions')
                .where('type', '==', 'ride_payment')
                .where('status', '==', 'completed')
                .where('createdAt', '>=', dayStart)
                .where('createdAt', '<=', dayEnd)
                .get();
            ridesByDay.push({
                date: dateStr,
                rides: ridesSnapshot.size
            });
        }
        // Get revenue by day
        const revenueByDay = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
            const dateStr = date.toISOString().split('T')[0];
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            const transactionsSnapshot = await firebase_1.db.collection('transactions')
                .where('type', '==', 'ride_payment')
                .where('status', '==', 'completed')
                .where('createdAt', '>=', dayStart)
                .where('createdAt', '<=', dayEnd)
                .get();
            const revenue = transactionsSnapshot.docs.reduce((sum, doc) => {
                const data = doc.data();
                return sum + (data.amount || 0);
            }, 0);
            revenueByDay.push({
                date: dateStr,
                revenue
            });
        }
        // Get popular routes
        const routesSnapshot = await firebase_1.db.collection('routes').get();
        const popularRoutes = await Promise.all(routesSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const ridesSnapshot = await firebase_1.db.collection('transactions')
                .where('routeId', '==', doc.id)
                .where('status', '==', 'completed')
                .get();
            return {
                routeName: data.routeName,
                rides: ridesSnapshot.size
            };
        }));
        // Sort by rides and take top 10
        popularRoutes.sort((a, b) => b.rides - a.rides);
        // Get user activity by hour (mock data for now)
        const userActivity = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            users: Math.floor(Math.random() * 50) + 10
        }));
        // Get top drivers
        const driversSnapshot = await firebase_1.db.collection('users')
            .where('role', '==', 'driver')
            .get();
        const topDrivers = await Promise.all(driversSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const ridesSnapshot = await firebase_1.db.collection('transactions')
                .where('driverId', '==', doc.id)
                .where('status', '==', 'completed')
                .get();
            const revenue = ridesSnapshot.docs.reduce((sum, t) => {
                const transactionData = t.data();
                return sum + (transactionData.amount || 0);
            }, 0);
            return {
                name: data.displayName || data.email,
                rides: ridesSnapshot.size,
                revenue
            };
        }));
        // Sort by revenue and take top 10
        topDrivers.sort((a, b) => b.revenue - a.revenue);
        // Get top passengers
        const passengersSnapshot = await firebase_1.db.collection('users')
            .where('role', '==', 'passenger')
            .get();
        const topPassengers = passengersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                name: data.displayName || data.email,
                rides: data.totalRides || 0,
                savings: data.totalMoneySaved || 0
            };
        });
        // Sort by rides and take top 10
        topPassengers.sort((a, b) => b.rides - a.rides);
        const analytics = {
            ridesByDay,
            revenueByDay,
            popularRoutes: popularRoutes.slice(0, 10),
            userActivity,
            topDrivers: topDrivers.slice(0, 10),
            topPassengers: topPassengers.slice(0, 10)
        };
        res.json(analytics);
    }
    catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics'
        });
    }
});
// Suspend user
const suspendUserSchema = joi_1.default.object({
    reason: joi_1.default.string().required(),
    notes: joi_1.default.string().optional()
});
router.post('/users/:userId/suspend', auth_1.authenticateUser, requireAdmin, (0, validation_1.validateRequest)(suspendUserSchema, 'body'), async (req, res) => {
    var _a;
    try {
        const { userId } = req.params;
        const { reason, notes } = req.body;
        await firebase_1.db.collection('users').doc(userId).update({
            isSuspended: true,
            suspensionReason: reason,
            suspensionNotes: notes,
            suspendedAt: firestore_1.Timestamp.now(),
            suspendedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid
        });
        // Create alert
        await firebase_1.db.collection('admin_alerts').add({
            type: 'warning',
            title: 'User Suspended',
            message: `User ${userId} has been suspended. Reason: ${reason}`,
            createdAt: firestore_1.Timestamp.now(),
            isRead: false
        });
        res.json({
            success: true,
            message: 'User suspended successfully'
        });
    }
    catch (error) {
        console.error('Error suspending user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to suspend user'
        });
    }
});
// Approve route
const approveRouteSchema = joi_1.default.object({
    notes: joi_1.default.string().optional()
});
router.post('/routes/:routeId/approve', auth_1.authenticateUser, requireAdmin, (0, validation_1.validateRequest)(approveRouteSchema, 'body'), async (req, res) => {
    var _a;
    try {
        const { routeId } = req.params;
        const { notes } = req.body;
        await firebase_1.db.collection('routes').doc(routeId).update({
            status: 'approved',
            approvedAt: firestore_1.Timestamp.now(),
            approvedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid,
            approvalNotes: notes
        });
        // Create alert
        await firebase_1.db.collection('admin_alerts').add({
            type: 'success',
            title: 'Route Approved',
            message: `Route ${routeId} has been approved.`,
            createdAt: firestore_1.Timestamp.now(),
            isRead: false
        });
        res.json({
            success: true,
            message: 'Route approved successfully'
        });
    }
    catch (error) {
        console.error('Error approving route:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to approve route'
        });
    }
});
// Reject route
const rejectRouteSchema = joi_1.default.object({
    reason: joi_1.default.string().required(),
    notes: joi_1.default.string().optional()
});
router.post('/routes/:routeId/reject', auth_1.authenticateUser, requireAdmin, (0, validation_1.validateRequest)(rejectRouteSchema, 'body'), async (req, res) => {
    var _a;
    try {
        const { routeId } = req.params;
        const { reason, notes } = req.body;
        await firebase_1.db.collection('routes').doc(routeId).update({
            status: 'rejected',
            rejectedAt: firestore_1.Timestamp.now(),
            rejectedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid,
            rejectionReason: reason,
            rejectionNotes: notes
        });
        // Create alert
        await firebase_1.db.collection('admin_alerts').add({
            type: 'warning',
            title: 'Route Rejected',
            message: `Route ${routeId} has been rejected. Reason: ${reason}`,
            createdAt: firestore_1.Timestamp.now(),
            isRead: false
        });
        res.json({
            success: true,
            message: 'Route rejected successfully'
        });
    }
    catch (error) {
        console.error('Error rejecting route:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reject route'
        });
    }
});
// Mark alert as read
router.post('/alerts/:alertId/read', auth_1.authenticateUser, requireAdmin, async (req, res) => {
    var _a;
    try {
        const { alertId } = req.params;
        await firebase_1.db.collection('admin_alerts').doc(alertId).update({
            isRead: true,
            readAt: firestore_1.Timestamp.now(),
            readBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid
        });
        res.json({
            success: true,
            message: 'Alert marked as read'
        });
    }
    catch (error) {
        console.error('Error marking alert as read:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark alert as read'
        });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map