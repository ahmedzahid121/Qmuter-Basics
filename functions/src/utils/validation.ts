import Joi from 'joi';

// Location validation
export const locationSchema = Joi.object({
  address: Joi.string().required().min(5).max(200),
  lat: Joi.number().required().min(-90).max(90),
  lng: Joi.number().required().min(-180).max(180),
  placeId: Joi.string().optional()
});

// Pickup point validation
export const pickupPointSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  address: Joi.string().required().min(5).max(200),
  lat: Joi.number().required().min(-90).max(90),
  lng: Joi.number().required().min(-180).max(180),
  placeId: Joi.string().optional()
});

// Schedule validation
export const scheduleSchema = Joi.object({
  type: Joi.string().valid('recurring', 'one-time').required(),
  days: Joi.array().items(Joi.string().valid(
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  )).when('type', {
    is: 'recurring',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  timezone: Joi.string().required(),
  startDate: Joi.string().isoDate().optional(),
  endDate: Joi.string().isoDate().optional()
});

// Create route validation
export const createRouteSchema = Joi.object({
  routeName: Joi.string().required().min(3).max(100),
  description: Joi.string().optional().max(500),
  startPoint: locationSchema.required(),
  endPoint: locationSchema.required(),
  pickupPoints: Joi.array().items(pickupPointSchema).min(1).max(10).required(),
  schedule: scheduleSchema.required(),
  totalSeats: Joi.number().integer().min(1).max(8).required(),
  pricePerSeat: Joi.number().positive().max(1000).required(),
  currency: Joi.string().length(3).uppercase().required()
});

// Update route validation
export const updateRouteSchema = Joi.object({
  routeName: Joi.string().optional().min(3).max(100),
  description: Joi.string().optional().max(500),
  startPoint: locationSchema.optional(),
  endPoint: locationSchema.optional(),
  pickupPoints: Joi.array().items(pickupPointSchema).min(1).max(10).optional(),
  schedule: scheduleSchema.optional(),
  totalSeats: Joi.number().integer().min(1).max(8).optional(),
  pricePerSeat: Joi.number().positive().max(1000).optional(),
  currency: Joi.string().length(3).uppercase().optional()
});

// Create booking validation
export const createBookingSchema = Joi.object({
  rideId: Joi.string().required(),
  pickupPoint: pickupPointSchema.required(),
  dropoffPoint: pickupPointSchema.required()
});

// Admin action validation
export const adminActionSchema = Joi.object({
  action: Joi.string().valid(
    'approve-route', 'reject-route', 'suspend-user', 'activate-user'
  ).required(),
  targetType: Joi.string().valid('route', 'user').required(),
  targetId: Joi.string().required(),
  reason: Joi.string().optional().max(500),
  notes: Joi.string().optional().max(1000)
});

// Pagination validation
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// Route filters validation
export const routeFiltersSchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'rejected', 'active', 'inactive').optional(),
  driverId: Joi.string().optional(),
  startDate: Joi.string().isoDate().optional(),
  endDate: Joi.string().isoDate().optional(),
  minPrice: Joi.number().positive().optional(),
  maxPrice: Joi.number().positive().optional(),
  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    radius: Joi.number().positive().max(50).default(10) // km
  }).optional()
});

// User update validation
export const userUpdateSchema = Joi.object({
  displayName: Joi.string().optional().min(2).max(50),
  phoneNumber: Joi.string().optional().pattern(/^\+?[\d\s\-\(\)]+$/),
  country: Joi.string().optional().max(100),
  licenseNumber: Joi.string().optional().max(50),
  carModel: Joi.string().optional().max(100),
  role: Joi.string().valid('driver', 'passenger').optional()
});

// Payment validation
export const paymentSchema = Joi.object({
  bookingId: Joi.string().required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).uppercase().required(),
  paymentMethod: Joi.string().valid('wallet', 'external').required(),
  transactionId: Joi.string().optional()
});

// Notification validation
export const notificationSchema = Joi.object({
  userId: Joi.string().required(),
  type: Joi.string().valid(
    'route-approved', 'route-rejected', 'booking-confirmed', 
    'ride-reminder', 'payment-received', 'driver-eta', 'rider-eta', 'arrival-notification'
  ).required(),
  title: Joi.string().required().max(100),
  message: Joi.string().required().max(500),
  data: Joi.object().optional()
});

// Live Tracking Validation Schemas

// Live location validation
export const liveLocationSchema = Joi.object({
  lat: Joi.number().required().min(-90).max(90),
  lng: Joi.number().required().min(-180).max(180),
  timestamp: Joi.number().required(),
  accuracy: Joi.number().positive().optional(),
  speed: Joi.number().positive().optional(),
  heading: Joi.number().min(0).max(360).optional()
});

// Update location validation
export const updateLocationSchema = Joi.object({
  tripId: Joi.string().required(),
  role: Joi.string().valid('driver', 'rider').required(),
  lat: Joi.number().required().min(-90).max(90),
  lng: Joi.number().required().min(-180).max(180),
  accuracy: Joi.number().positive().optional(),
  speed: Joi.number().positive().optional(),
  heading: Joi.number().min(0).max(360).optional()
});

// Start tracking validation
export const startTrackingSchema = Joi.object({
  tripId: Joi.string().required(),
  driverId: Joi.string().required(),
  riderId: Joi.string().required(),
  routeId: Joi.string().required(),
  pickupLocation: locationSchema.required(),
  dropoffLocation: locationSchema.required()
});

// ETA request validation
export const etaRequestSchema = Joi.object({
  origin: locationSchema.required(),
  destination: locationSchema.required(),
  mode: Joi.string().valid('driving', 'walking', 'transit').default('driving')
});

// Trip status validation
export const tripStatusSchema = Joi.object({
  status: Joi.string().valid('en_route_to_pickup', 'en_route_to_dropoff', 'completed', 'cancelled').required(),
  driverArrived: Joi.boolean().required(),
  riderArrived: Joi.boolean().required(),
  driverETA: Joi.number().min(0).required(),
  riderETA: Joi.number().min(0).required(),
  lastUpdated: Joi.number().required()
});

// Notification flags validation
export const notificationFlagsSchema = Joi.object({
  driver10: Joi.boolean().required(),
  driver5: Joi.boolean().required(),
  rider10: Joi.boolean().required(),
  rider5: Joi.boolean().required(),
  driverArrived: Joi.boolean().required(),
  riderArrived: Joi.boolean().required(),
  bothArrived: Joi.boolean().required()
});

// Live tracking data validation
export const liveTrackingDataSchema = Joi.object({
  tripId: Joi.string().required(),
  driverLocation: liveLocationSchema.required(),
  riderLocation: liveLocationSchema.required(),
  pickupLocation: locationSchema.required(),
  dropoffLocation: locationSchema.required(),
  tripStatus: tripStatusSchema.required(),
  notified: notificationFlagsSchema.required(),
  driverId: Joi.string().required(),
  riderId: Joi.string().required(),
  routeId: Joi.string().required(),
  createdAt: Joi.number().required(),
  updatedAt: Joi.number().required()
});

// Validation helper function
export const validateRequest = <T>(schema: Joi.Schema, data: any): T => {
  const { error, value } = schema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  if (error) {
    throw new Error(`Validation error: ${error.details.map(d => d.message).join(', ')}`);
  }
  
  return value;
}; 