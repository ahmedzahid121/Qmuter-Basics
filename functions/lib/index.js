"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// import planRouteRouter from './routes/plan-route';
const gtfs_1 = __importDefault(require("./routes/gtfs"));
// Initialize Express app
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));
// Handle preflight requests
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.sendStatus(200);
});
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging middleware
app.use((req, res, next) => {
    var _a, _b;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log('Available routes:', (_b = (_a = app._router) === null || _a === void 0 ? void 0 : _a.stack) === null || _b === void 0 ? void 0 : _b.map((layer) => { var _a, _b; return ((_a = layer.route) === null || _a === void 0 ? void 0 : _a.path) || ((_b = layer.regexp) === null || _b === void 0 ? void 0 : _b.toString()); }));
    next();
});
// Debug: Log all registered routes on startup
console.log('=== REGISTERED ROUTES ===');
(_b = (_a = app._router) === null || _a === void 0 ? void 0 : _a.stack) === null || _b === void 0 ? void 0 : _b.forEach((layer, index) => {
    if (layer.route) {
        console.log(`Route ${index}: ${Object.keys(layer.route.methods).join(', ').toUpperCase()} ${layer.route.path}`);
    }
});
console.log('=== END ROUTES ===');
// Mount GTFS routes
app.use('/v1/gtfs', gtfs_1.default);
// Mount plan-route routes (remove /api prefix since Firebase hosting adds it)
// Temporarily add a simple test route to debug
app.get('/v1/routes', (req, res) => {
    console.log('Routes endpoint called');
    res.json({
        success: true,
        message: 'Routes endpoint working',
        timestamp: new Date().toISOString()
    });
});
// app.use('/v1/routes', planRouteRouter);
// Health check endpoint
app.get('/v1/health', (req, res) => {
    console.log('Health check endpoint called');
    res.json({
        success: true,
        message: 'Qmuter API is running',
        timestamp: new Date().toISOString()
    });
});
// Simple test endpoint
app.get('/test', (req, res) => {
    console.log('Test endpoint called');
    res.json({
        success: true,
        message: 'Test endpoint working',
        timestamp: new Date().toISOString()
    });
});
// Note: Route handlers are now in plan-route.ts router
app.get('/v1/users/stats', (req, res) => {
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
app.get('/v1/bookings', (req, res) => {
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
app.post('/v1/bookings', (req, res) => {
    res.json({
        success: true,
        message: 'Booking created successfully'
    });
});
app.post('/v1/bookings/:id/cancel', (req, res) => {
    res.json({
        success: true,
        message: 'Booking cancelled successfully'
    });
});
// Live tracking endpoints
app.post('/v1/live-tracking/start', (req, res) => {
    res.json({
        success: true,
        message: 'Tracking started successfully'
    });
});
app.post('/v1/live-tracking/update-location', (req, res) => {
    res.json({
        success: true,
        message: 'Location updated successfully'
    });
});
app.get('/v1/live-tracking/status/:tripId', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'active',
            location: { lat: -36.8501, lng: 174.7652 }
        }
    });
});
// Chat endpoints
app.get('/v1/conversations', (req, res) => {
    res.json({
        success: true,
        data: []
    });
});
app.get('/v1/conversations/:id/messages', (req, res) => {
    res.json({
        success: true,
        data: []
    });
});
app.post('/v1/conversations/:id/messages', (req, res) => {
    res.json({
        success: true,
        message: 'Message sent successfully'
    });
});
// Notifications endpoints
app.get('/v1/notifications', (req, res) => {
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
app.post('/v1/notifications/:id/read', (req, res) => {
    res.json({
        success: true,
        message: 'Notification marked as read'
    });
});
// Payment endpoints
app.post('/v1/payments/top-up', (req, res) => {
    res.json({
        success: true,
        message: 'Wallet topped up successfully'
    });
});
app.get('/v1/payments/history', (req, res) => {
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
app.get('/v1/admin/routes/pending', (req, res) => {
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
app.post('/v1/admin/routes/:id/approve', (req, res) => {
    res.json({
        success: true,
        message: 'Route approved successfully'
    });
});
app.post('/v1/admin/routes/:id/reject', (req, res) => {
    res.json({
        success: true,
        message: 'Route rejected successfully'
    });
});
app.post('/v1/admin/users/:id/suspend', (req, res) => {
    res.json({
        success: true,
        message: 'User suspended successfully'
    });
});
app.get('/v1/admin/stats', (req, res) => {
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
// Start server for Cloud Run
const PORT = process.env.PORT || 8080;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
//# sourceMappingURL=index.js.map