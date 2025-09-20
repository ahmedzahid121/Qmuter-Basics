"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const routeService_1 = require("../services/routeService");
// import { AdminService } from '../services/adminService';
const auth_1 = require("../middleware/auth");
const gtfs_1 = __importDefault(require("./gtfs"));
// import adminRoutes from './admin';
const emergency_1 = __importDefault(require("./emergency"));
const router = express_1.default.Router();
const routeService = new routeService_1.RouteService();
// const adminService = new AdminService();
// Apply middleware to all routes
router.use(auth_1.cors);
router.use((0, auth_1.rateLimit)(100, 15 * 60 * 1000)); // 100 requests per 15 minutes
// Route Management Endpoints
// =========================
// Create a new route proposal
router.post('/routes', auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const result = yield routeService.createRoute(req.user.uid, req.body);
        if (result.success) {
            res.status(201).json(result);
        }
        else {
            res.status(400).json(result);
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create route'
        });
    }
}));
// Get route by ID
router.get('/routes/:routeId', auth_1.optionalAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield routeService.getRoute(req.params.routeId);
        if (result.success) {
            res.json(result);
        }
        else {
            res.status(404).json(result);
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get route'
        });
    }
}));
// Update route
router.put('/routes/:routeId', auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const result = yield routeService.updateRoute(req.params.routeId, req.user.uid, req.body);
        if (result.success) {
            res.json(result);
        }
        else {
            res.status(400).json(result);
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update route'
        });
    }
}));
// Delete route
router.delete('/routes/:routeId', auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const result = yield routeService.deleteRoute(req.params.routeId, req.user.uid);
        if (result.success) {
            res.json(result);
        }
        else {
            res.status(400).json(result);
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete route'
        });
    }
}));
// Get routes with filters and pagination
router.get('/routes', auth_1.optionalAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const filters = {
            status: req.query.status,
            driverId: req.query.driverId,
            minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
            maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
            location: req.query.lat && req.query.lng ? {
                lat: Number(req.query.lat),
                lng: Number(req.query.lng),
                radius: req.query.radius ? Number(req.query.radius) : 10
            } : undefined
        };
        const pagination = {
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 10,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        };
        const result = yield routeService.getRoutes(filters, pagination);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get routes'
        });
    }
}));
// Get routes by driver
router.get('/drivers/:driverId/routes', auth_1.optionalAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield routeService.getRoutesByDriver(req.params.driverId, req.query.status);
        if (result.success) {
            res.json(result);
        }
        else {
            res.status(400).json(result);
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get driver routes'
        });
    }
}));
// Vote on route
router.post('/routes/:routeId/vote', auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const { vote } = req.body;
        if (!vote || !['upvote', 'downvote'].includes(vote)) {
            return res.status(400).json({
                success: false,
                error: 'Vote must be either "upvote" or "downvote"'
            });
        }
        const result = yield routeService.voteOnRoute(req.params.routeId, req.user.uid, vote);
        if (result.success) {
            res.json(result);
        }
        else {
            res.status(400).json(result);
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to vote on route'
        });
    }
}));
// Get nearby routes
router.get('/routes/nearby', auth_1.optionalAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lat, lng, radius } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                error: 'Latitude and longitude are required'
            });
        }
        const result = yield routeService.getNearbyRoutes(Number(lat), Number(lng), radius ? Number(radius) : 10);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get nearby routes'
        });
    }
}));
// Admin Endpoints
// ===============
// Get pending routes (admin only)
router.get('/admin/routes/pending', auth_1.authenticateUser, auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pagination = {
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 10
        };
        // const result = await adminService.getPendingRoutes(pagination);
        const result = { success: true, data: [], message: 'Admin routes coming soon' };
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get pending routes'
        });
    }
}));
// Approve route (admin only)
router.post('/admin/routes/:routeId/approve', auth_1.authenticateUser, auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const { notes } = req.body;
        // const result = await adminService.approveRoute(req.params.routeId, req.user.uid, notes);
        const result = { success: true, message: 'Route approval coming soon' };
        if (result.success) {
            res.json(result);
        }
        else {
            res.status(400).json(result);
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to approve route'
        });
    }
}));
// Reject route (admin only)
router.post('/admin/routes/:routeId/reject', auth_1.authenticateUser, auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const { reason, notes } = req.body;
        if (!reason) {
            return res.status(400).json({
                success: false,
                error: 'Rejection reason is required'
            });
        }
        // const result = await adminService.rejectRoute(req.params.routeId, req.user.uid, reason, notes);
        const result = { success: true, message: 'Route rejection coming soon' };
        if (result.success) {
            res.json(result);
        }
        else {
            res.status(400).json(result);
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to reject route'
        });
    }
}));
// Suspend user (admin only)
router.post('/admin/users/:userId/suspend', auth_1.authenticateUser, auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const { reason, notes } = req.body;
        if (!reason) {
            return res.status(400).json({
                success: false,
                error: 'Suspension reason is required'
            });
        }
        // const result = await adminService.suspendUser(req.params.userId, req.user.uid, reason, notes);
        const result = { success: true, message: 'User suspension coming soon' };
        if (result.success) {
            res.json(result);
        }
        else {
            res.status(400).json(result);
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to suspend user'
        });
    }
}));
// Activate user (admin only)
router.post('/admin/users/:userId/activate', auth_1.authenticateUser, auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const { notes } = req.body;
        // const result = await adminService.activateUser(req.params.userId, req.user.uid, notes);
        const result = { success: true, message: 'User activation coming soon' };
        if (result.success) {
            res.json(result);
        }
        else {
            res.status(400).json(result);
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to activate user'
        });
    }
}));
// Get admin actions (admin only)
router.get('/admin/actions', auth_1.authenticateUser, auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pagination = {
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 10
        };
        // const result = await adminService.getAdminActions(pagination);
        const result = { success: true, data: [], message: 'Admin actions coming soon' };
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get admin actions'
        });
    }
}));
// Get system statistics (admin only)
router.get('/admin/stats', auth_1.authenticateUser, auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const result = await adminService.getSystemStats();
        const result = { success: true, data: {}, message: 'System stats coming soon' };
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get system stats'
        });
    }
}));
// Get users (admin only)
router.get('/admin/users', auth_1.authenticateUser, auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const filters = {
            role: req.query.role,
            suspended: req.query.suspended !== undefined ? req.query.suspended === 'true' : undefined
        };
        const pagination = {
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 10
        };
        // const result = await adminService.getUsers(filters, pagination);
        const result = { success: true, data: [], message: 'User management coming soon' };
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get users'
        });
    }
}));
// GTFS Routes
router.use('/gtfs', gtfs_1.default);
// Admin Routes
// router.use('/admin', adminRoutes);
// Emergency Routes
router.use('/emergency', emergency_1.default);
// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Qmuter API is running',
        timestamp: new Date().toISOString()
    });
});
// Apply error handling middleware
router.use(auth_1.errorHandler);
exports.default = router;
//# sourceMappingURL=routes.js.map