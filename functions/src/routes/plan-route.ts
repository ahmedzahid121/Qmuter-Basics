import { Router, Request, Response, NextFunction } from 'express';
import { authenticateUser } from '../middleware/auth';
import { validateRequest } from '../utils/validation';
import Joi from 'joi';
import { admin } from '../config/firebase';
import { db } from '../config/firebase';

const router = Router();

// Route suggestion schema
const routeSuggestionSchema = Joi.object({
  origin: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required()
  }).required(),
  destination: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required()
  }).required()
});

// Create route instance schema
const createRouteSchema = Joi.object({
  checkpointStopIds: Joi.array().items(Joi.string()).min(2).required(),
  seatsTotal: Joi.number().integer().min(1).max(6).required(),
  startTime: Joi.string().required(),
  price: Joi.number().positive().required(),
  notes: Joi.string().optional()
});

// Booking schema
const bookingSchema = Joi.object({
  routeInstanceId: Joi.string().required(),
  boardStopId: Joi.string().required(),
  alightStopId: Joi.string().required()
});

// Validation middleware wrapper
const validateSchema = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      validateRequest(schema, req.body);
      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      });
    }
  };
};

// Get route suggestions
router.post('/suggest', validateSchema(routeSuggestionSchema), async (req, res) => {
  try {
    const { origin, destination } = req.body;

    // Mock route suggestions based on AT stops
    // In production, this would use GTFS data and shortest path algorithm
    const suggestions = [
      {
        id: 1,
        checkpointStopIds: ['s100', 's134', 's167', 's240'],
        etaMin: 23,
        distanceKm: 15.3,
        zones: 5,
        price: 8.0,
        stops: [
          { id: 's100', name: 'Britomart Station', address: 'Britomart, Auckland' },
          { id: 's134', name: 'Newmarket Station', address: 'Newmarket, Auckland' },
          { id: 's167', name: 'Remuera Station', address: 'Remuera, Auckland' },
          { id: 's240', name: 'Greenlane Station', address: 'Greenlane, Auckland' }
        ]
      },
      {
        id: 2,
        checkpointStopIds: ['s100', 's145', 's180', 's240'],
        etaMin: 28,
        distanceKm: 16.1,
        zones: 5,
        price: 8.0,
        stops: [
          { id: 's100', name: 'Britomart Station', address: 'Britomart, Auckland' },
          { id: 's145', name: 'Parnell Station', address: 'Parnell, Auckland' },
          { id: 's180', name: 'Eden Terrace Station', address: 'Eden Terrace, Auckland' },
          { id: 's240', name: 'Greenlane Station', address: 'Greenlane, Auckland' }
        ]
      }
    ];

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Error getting route suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get route suggestions'
    });
  }
});

// Get live routes near location
router.get('/live', authenticateUser, async (req, res) => {
  try {
    const { near, radius = 2000 } = req.query;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!near || typeof near !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Near parameter required'
      });
    }

    const [lat, lng] = near.split(',').map(Number);

    // Get live route instances from Firestore
    const liveRoutesRef = db.collection('routeInstances')
      .where('status', '==', 'LIVE')
      .where('seatsFree', '>', 0);

    const snapshot = await liveRoutesRef.get();
    const liveRoutes: any[] = [];

    for (const doc of snapshot.docs) {
      const routeData = doc.data();
      
      if (!routeData) continue;
      
      // Simple distance calculation (in production, use proper geospatial queries)
      const distance = Math.sqrt(
        Math.pow((routeData.startPoint?.lat || 0) - lat, 2) + 
        Math.pow((routeData.startPoint?.lng || 0) - lng, 2)
      ) * 111000; // Rough km conversion

      const radiusValue = typeof radius === 'string' ? parseInt(radius) : (typeof radius === 'number' ? radius : 2000);
      if (distance <= radiusValue) {
        // Get driver info
        const driverDoc = await db.collection('users').doc(routeData.driverId).get();
        const driverData = driverDoc.data();

        liveRoutes.push({
          id: doc.id,
          driverName: driverData?.displayName || 'Anonymous',
          seatsTotal: routeData.seatsTotal,
          seatsFree: routeData.seatsFree,
          startTime: routeData.startTime,
          price: routeData.price,
          checkpointStopIds: routeData.checkpointStopIds,
          stops: routeData.stops || [],
          etaMin: routeData.etaMin || 25,
          distanceKm: routeData.distanceKm || 15.0
        });
      }
    }

    res.json({
      success: true,
      data: liveRoutes
    });
  } catch (error) {
    console.error('Error getting live routes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get live routes'
    });
  }
});

// Create live route instance (Driver)
router.post('/', authenticateUser, validateSchema(createRouteSchema), async (req, res) => {
  try {
    const routeData = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Create route instance in Firestore
    const routeInstance = {
      driverId: userId,
      status: 'LIVE',
      seatsTotal: routeData.seatsTotal,
      seatsFree: routeData.seatsTotal,
      startTime: routeData.startTime,
      price: routeData.price,
      notes: routeData.notes,
      checkpointStopIds: routeData.checkpointStopIds,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('routeInstances').add(routeInstance);

    res.json({
      success: true,
      data: {
        id: docRef.id,
        ...routeInstance
      }
    });
  } catch (error) {
    console.error('Error creating route instance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create route instance'
    });
  }
});

// Create booking (Rider)
router.post('/bookings', authenticateUser, validateSchema(bookingSchema), async (req, res) => {
  try {
    const bookingData = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Create booking in Firestore
    const booking = {
      riderId: userId,
      routeInstanceId: bookingData.routeInstanceId,
      boardStopId: bookingData.boardStopId,
      alightStopId: bookingData.alightStopId,
      status: 'HELD',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('bookings').add(booking);

    res.json({
      success: true,
      data: {
        id: docRef.id,
        ...booking
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking'
    });
  }
});

// Confirm booking
router.post('/bookings/:bookingId/confirm', authenticateUser, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Update booking status in Firestore
    await db.collection('bookings').doc(bookingId).update({
      status: 'CONFIRMED',
      updatedAt: new Date()
    });

    res.json({
      success: true,
      data: {
        id: bookingId,
        status: 'CONFIRMED'
      }
    });
  } catch (error) {
    console.error('Error confirming booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm booking'
    });
  }
});

export default router;
