"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// Initialize Express app
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
// Health check endpoint
app.get('/api/v1/health', (req, res) => {
    res.json({
        success: true,
        message: 'Qmuter API is running',
        timestamp: new Date().toISOString()
    });
});
// Mock routes for now - we'll implement real functionality
app.get('/api/v1/routes', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: '1',
                routeName: 'Downtown Express',
                driverName: 'Sarah M.',
                pickup: 'Auckland Central',
                destination: 'North Shore',
                departureTime: '08:00',
                price: 5.00,
                availableSeats: 2,
                rating: 4.8,
                status: 'active'
            },
            {
                id: '2',
                routeName: 'CBD Commute',
                driverName: 'Mike R.',
                pickup: 'Mt Eden',
                destination: 'CBD',
                departureTime: '07:30',
                price: 3.50,
                availableSeats: 1,
                rating: 4.9,
                status: 'active'
            }
        ],
        message: 'Routes retrieved successfully'
    });
});
app.post('/api/v1/routes', (req, res) => {
    res.json({
        success: true,
        message: 'Route created successfully',
        data: Object.assign(Object.assign({ id: '3' }, req.body), { status: 'pending' })
    });
});
app.get('/api/v1/users/stats', (req, res) => {
    res.json({
        success: true,
        data: {
            totalRides: 12,
            totalCO2Saved: 45.2,
            totalMoneySaved: 156.80,
            badgeTier: 'Silver'
        }
    });
});
app.get('/api/v1/bookings', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: '1',
                routeName: 'Downtown Express',
                driverName: 'John Smith',
                pickup: '123 Main St, Anytown',
                destination: '456 Business Ave, Downtown',
                date: '15/01/2024',
                time: '08:00',
                seats: 1,
                price: 5.00,
                status: 'upcoming'
            }
        ],
        message: 'Bookings retrieved successfully'
    });
});
app.post('/api/v1/bookings', (req, res) => {
    res.json({
        success: true,
        message: 'Booking created successfully'
    });
});
app.post('/api/v1/bookings/:id/cancel', (req, res) => {
    res.json({
        success: true,
        message: 'Booking cancelled successfully'
    });
});
// Live tracking endpoints
app.post('/api/v1/live-tracking/start', (req, res) => {
    res.json({
        success: true,
        message: 'Tracking started successfully'
    });
});
app.post('/api/v1/live-tracking/update-location', (req, res) => {
    res.json({
        success: true,
        message: 'Location updated successfully'
    });
});
app.get('/api/v1/live-tracking/status/:tripId', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'active',
            location: { lat: -36.8501, lng: 174.7652 }
        }
    });
});
// Chat endpoints
app.get('/api/v1/conversations', (req, res) => {
    res.json({
        success: true,
        data: []
    });
});
app.get('/api/v1/conversations/:id/messages', (req, res) => {
    res.json({
        success: true,
        data: []
    });
});
app.post('/api/v1/conversations/:id/messages', (req, res) => {
    res.json({
        success: true,
        message: 'Message sent successfully'
    });
});
// Notifications endpoints
app.get('/api/v1/notifications', (req, res) => {
    res.json({
        success: true,
        data: [],
        pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
        }
    });
});
app.post('/api/v1/notifications/:id/read', (req, res) => {
    res.json({
        success: true,
        message: 'Notification marked as read'
    });
});
// Payment endpoints
app.post('/api/v1/payments/top-up', (req, res) => {
    res.json({
        success: true,
        message: 'Wallet topped up successfully'
    });
});
app.get('/api/v1/payments/history', (req, res) => {
    res.json({
        success: true,
        data: [],
        pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
        }
    });
});
// Admin endpoints
app.get('/api/v1/admin/routes/pending', (req, res) => {
    res.json({
        success: true,
        data: [],
        pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
        }
    });
});
app.post('/api/v1/admin/routes/:id/approve', (req, res) => {
    res.json({
        success: true,
        message: 'Route approved successfully'
    });
});
app.post('/api/v1/admin/routes/:id/reject', (req, res) => {
    res.json({
        success: true,
        message: 'Route rejected successfully'
    });
});
app.post('/api/v1/admin/users/:id/suspend', (req, res) => {
    res.json({
        success: true,
        message: 'User suspended successfully'
    });
});
app.get('/api/v1/admin/stats', (req, res) => {
    res.json({
        success: true,
        data: {
            totalUsers: 150,
            totalRoutes: 45,
            totalRevenue: 1250.50,
            activeRides: 12
        }
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl
    });
});
// Global error handler
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});
// Export for Google Cloud Functions 2nd gen
exports.api = app;
//# sourceMappingURL=index.js.map