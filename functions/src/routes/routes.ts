import express from 'express';
import { RouteService } from '../services/routeService';
// import { AdminService } from '../services/adminService';
import { 
  authenticateUser, 
  requireAdmin, 
  optionalAuth, 
  rateLimit, 
  cors, 
  errorHandler 
} from '../middleware/auth';
import { validateRequest, createRouteSchema, updateRouteSchema } from '../utils/validation';
import gtfsRoutes from './gtfs';
// import adminRoutes from './admin';
import emergencyRoutes from './emergency';

const router = express.Router();
const routeService = new RouteService();
// const adminService = new AdminService();

// Apply middleware to all routes
router.use(cors);
router.use(rateLimit(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

// Route Management Endpoints
// =========================

// Create a new route proposal
router.post('/routes', authenticateUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const result = await routeService.createRoute(req.user.uid, req.body);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create route'
    });
  }
});

// Get route by ID
router.get('/routes/:routeId', optionalAuth, async (req, res) => {
  try {
    const result = await routeService.getRoute(req.params.routeId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get route'
    });
  }
});

// Update route
router.put('/routes/:routeId', authenticateUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const result = await routeService.updateRoute(req.params.routeId, req.user.uid, req.body);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update route'
    });
  }
});

// Delete route
router.delete('/routes/:routeId', authenticateUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const result = await routeService.deleteRoute(req.params.routeId, req.user.uid);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete route'
    });
  }
});

// Get routes with filters and pagination
router.get('/routes', optionalAuth, async (req, res) => {
  try {
    const filters = {
      status: req.query.status as string,
      driverId: req.query.driverId as string,
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
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const result = await routeService.getRoutes(filters, pagination);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get routes'
    });
  }
});

// Get routes by driver
router.get('/drivers/:driverId/routes', optionalAuth, async (req, res) => {
  try {
    const result = await routeService.getRoutesByDriver(
      req.params.driverId, 
      req.query.status as string
    );
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get driver routes'
    });
  }
});

// Vote on route
router.post('/routes/:routeId/vote', authenticateUser, async (req, res) => {
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

    const result = await routeService.voteOnRoute(req.params.routeId, req.user.uid, vote);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to vote on route'
    });
  }
});

// Get nearby routes
router.get('/routes/nearby', optionalAuth, async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const result = await routeService.getNearbyRoutes(
      Number(lat),
      Number(lng),
      radius ? Number(radius) : 10
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get nearby routes'
    });
  }
});

// Admin Endpoints
// ===============

// Get pending routes (admin only)
router.get('/admin/routes/pending', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const pagination = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10
    };

    // const result = await adminService.getPendingRoutes(pagination);
    const result = { success: true, data: [], message: 'Admin routes coming soon' };
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get pending routes'
    });
  }
});

// Approve route (admin only)
router.post('/admin/routes/:routeId/approve', authenticateUser, requireAdmin, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { notes } = req.body;
    // const result = await adminService.approveRoute(req.params.routeId, req.user.uid, notes);
    const result = { success: true, message: 'Route approval coming soon' };
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve route'
    });
  }
});

// Reject route (admin only)
router.post('/admin/routes/:routeId/reject', authenticateUser, requireAdmin, async (req, res) => {
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
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject route'
    });
  }
});

// Suspend user (admin only)
router.post('/admin/users/:userId/suspend', authenticateUser, requireAdmin, async (req, res) => {
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
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to suspend user'
    });
  }
});

// Activate user (admin only)
router.post('/admin/users/:userId/activate', authenticateUser, requireAdmin, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { notes } = req.body;
    // const result = await adminService.activateUser(req.params.userId, req.user.uid, notes);
    const result = { success: true, message: 'User activation coming soon' };
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to activate user'
    });
  }
});

// Get admin actions (admin only)
router.get('/admin/actions', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const pagination = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10
    };

    // const result = await adminService.getAdminActions(pagination);
    const result = { success: true, data: [], message: 'Admin actions coming soon' };
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get admin actions'
    });
  }
});

// Get system statistics (admin only)
router.get('/admin/stats', authenticateUser, requireAdmin, async (req, res) => {
  try {
    // const result = await adminService.getSystemStats();
    const result = { success: true, data: {}, message: 'System stats coming soon' };
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get system stats'
    });
  }
});

// Get users (admin only)
router.get('/admin/users', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const filters = {
      role: req.query.role as string,
      suspended: req.query.suspended !== undefined ? req.query.suspended === 'true' : undefined
    };

    const pagination = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10
    };

    // const result = await adminService.getUsers(filters, pagination);
    const result = { success: true, data: [], message: 'User management coming soon' };
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get users'
    });
  }
});

// GTFS Routes
router.use('/gtfs', gtfsRoutes);

// Admin Routes
// router.use('/admin', adminRoutes);

// Emergency Routes
router.use('/emergency', emergencyRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Qmuter API is running',
    timestamp: new Date().toISOString()
  });
});

// Apply error handling middleware
router.use(errorHandler);

export default router; 