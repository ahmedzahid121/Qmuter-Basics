"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = exports.liveTrackingDataSchema = exports.notificationFlagsSchema = exports.tripStatusSchema = exports.etaRequestSchema = exports.startTrackingSchema = exports.updateLocationSchema = exports.liveLocationSchema = exports.notificationSchema = exports.paymentSchema = exports.userUpdateSchema = exports.routeFiltersSchema = exports.paginationSchema = exports.adminActionSchema = exports.createBookingSchema = exports.updateRouteSchema = exports.createRouteSchema = exports.scheduleSchema = exports.pickupPointSchema = exports.locationSchema = void 0;
const joi_1 = __importDefault(require("joi"));
// Location validation
exports.locationSchema = joi_1.default.object({
    address: joi_1.default.string().required().min(5).max(200),
    lat: joi_1.default.number().required().min(-90).max(90),
    lng: joi_1.default.number().required().min(-180).max(180),
    placeId: joi_1.default.string().optional()
});
// Pickup point validation
exports.pickupPointSchema = joi_1.default.object({
    name: joi_1.default.string().required().min(2).max(100),
    address: joi_1.default.string().required().min(5).max(200),
    lat: joi_1.default.number().required().min(-90).max(90),
    lng: joi_1.default.number().required().min(-180).max(180),
    placeId: joi_1.default.string().optional()
});
// Schedule validation
exports.scheduleSchema = joi_1.default.object({
    type: joi_1.default.string().valid('recurring', 'one-time').required(),
    days: joi_1.default.array().items(joi_1.default.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')).when('type', {
        is: 'recurring',
        then: joi_1.default.required(),
        otherwise: joi_1.default.forbidden()
    }),
    time: joi_1.default.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    timezone: joi_1.default.string().required(),
    startDate: joi_1.default.string().isoDate().optional(),
    endDate: joi_1.default.string().isoDate().optional()
});
// Create route validation
exports.createRouteSchema = joi_1.default.object({
    routeName: joi_1.default.string().required().min(3).max(100),
    description: joi_1.default.string().optional().max(500),
    startPoint: exports.locationSchema.required(),
    endPoint: exports.locationSchema.required(),
    pickupPoints: joi_1.default.array().items(exports.pickupPointSchema).min(1).max(10).required(),
    schedule: exports.scheduleSchema.required(),
    totalSeats: joi_1.default.number().integer().min(1).max(8).required(),
    pricePerSeat: joi_1.default.number().positive().max(1000).required(),
    currency: joi_1.default.string().length(3).uppercase().required()
});
// Update route validation
exports.updateRouteSchema = joi_1.default.object({
    routeName: joi_1.default.string().optional().min(3).max(100),
    description: joi_1.default.string().optional().max(500),
    startPoint: exports.locationSchema.optional(),
    endPoint: exports.locationSchema.optional(),
    pickupPoints: joi_1.default.array().items(exports.pickupPointSchema).min(1).max(10).optional(),
    schedule: exports.scheduleSchema.optional(),
    totalSeats: joi_1.default.number().integer().min(1).max(8).optional(),
    pricePerSeat: joi_1.default.number().positive().max(1000).optional(),
    currency: joi_1.default.string().length(3).uppercase().optional()
});
// Create booking validation
exports.createBookingSchema = joi_1.default.object({
    rideId: joi_1.default.string().required(),
    pickupPoint: exports.pickupPointSchema.required(),
    dropoffPoint: exports.pickupPointSchema.required()
});
// Admin action validation
exports.adminActionSchema = joi_1.default.object({
    action: joi_1.default.string().valid('approve-route', 'reject-route', 'suspend-user', 'activate-user').required(),
    targetType: joi_1.default.string().valid('route', 'user').required(),
    targetId: joi_1.default.string().required(),
    reason: joi_1.default.string().optional().max(500),
    notes: joi_1.default.string().optional().max(1000)
});
// Pagination validation
exports.paginationSchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    sortBy: joi_1.default.string().optional(),
    sortOrder: joi_1.default.string().valid('asc', 'desc').default('desc')
});
// Route filters validation
exports.routeFiltersSchema = joi_1.default.object({
    status: joi_1.default.string().valid('pending', 'approved', 'rejected', 'active', 'inactive').optional(),
    driverId: joi_1.default.string().optional(),
    startDate: joi_1.default.string().isoDate().optional(),
    endDate: joi_1.default.string().isoDate().optional(),
    minPrice: joi_1.default.number().positive().optional(),
    maxPrice: joi_1.default.number().positive().optional(),
    location: joi_1.default.object({
        lat: joi_1.default.number().required(),
        lng: joi_1.default.number().required(),
        radius: joi_1.default.number().positive().max(50).default(10) // km
    }).optional()
});
// User update validation
exports.userUpdateSchema = joi_1.default.object({
    displayName: joi_1.default.string().optional().min(2).max(50),
    phoneNumber: joi_1.default.string().optional().pattern(/^\+?[\d\s\-\(\)]+$/),
    country: joi_1.default.string().optional().max(100),
    licenseNumber: joi_1.default.string().optional().max(50),
    carModel: joi_1.default.string().optional().max(100),
    role: joi_1.default.string().valid('driver', 'passenger').optional()
});
// Payment validation
exports.paymentSchema = joi_1.default.object({
    bookingId: joi_1.default.string().required(),
    amount: joi_1.default.number().positive().required(),
    currency: joi_1.default.string().length(3).uppercase().required(),
    paymentMethod: joi_1.default.string().valid('wallet', 'external').required(),
    transactionId: joi_1.default.string().optional()
});
// Notification validation
exports.notificationSchema = joi_1.default.object({
    userId: joi_1.default.string().required(),
    type: joi_1.default.string().valid('route-approved', 'route-rejected', 'booking-confirmed', 'ride-reminder', 'payment-received', 'driver-eta', 'rider-eta', 'arrival-notification').required(),
    title: joi_1.default.string().required().max(100),
    message: joi_1.default.string().required().max(500),
    data: joi_1.default.object().optional()
});
// Live Tracking Validation Schemas
// Live location validation
exports.liveLocationSchema = joi_1.default.object({
    lat: joi_1.default.number().required().min(-90).max(90),
    lng: joi_1.default.number().required().min(-180).max(180),
    timestamp: joi_1.default.number().required(),
    accuracy: joi_1.default.number().positive().optional(),
    speed: joi_1.default.number().positive().optional(),
    heading: joi_1.default.number().min(0).max(360).optional()
});
// Update location validation
exports.updateLocationSchema = joi_1.default.object({
    tripId: joi_1.default.string().required(),
    role: joi_1.default.string().valid('driver', 'rider').required(),
    lat: joi_1.default.number().required().min(-90).max(90),
    lng: joi_1.default.number().required().min(-180).max(180),
    accuracy: joi_1.default.number().positive().optional(),
    speed: joi_1.default.number().positive().optional(),
    heading: joi_1.default.number().min(0).max(360).optional()
});
// Start tracking validation
exports.startTrackingSchema = joi_1.default.object({
    tripId: joi_1.default.string().required(),
    driverId: joi_1.default.string().required(),
    riderId: joi_1.default.string().required(),
    routeId: joi_1.default.string().required(),
    pickupLocation: exports.locationSchema.required(),
    dropoffLocation: exports.locationSchema.required()
});
// ETA request validation
exports.etaRequestSchema = joi_1.default.object({
    origin: exports.locationSchema.required(),
    destination: exports.locationSchema.required(),
    mode: joi_1.default.string().valid('driving', 'walking', 'transit').default('driving')
});
// Trip status validation
exports.tripStatusSchema = joi_1.default.object({
    status: joi_1.default.string().valid('en_route_to_pickup', 'en_route_to_dropoff', 'completed', 'cancelled').required(),
    driverArrived: joi_1.default.boolean().required(),
    riderArrived: joi_1.default.boolean().required(),
    driverETA: joi_1.default.number().min(0).required(),
    riderETA: joi_1.default.number().min(0).required(),
    lastUpdated: joi_1.default.number().required()
});
// Notification flags validation
exports.notificationFlagsSchema = joi_1.default.object({
    driver10: joi_1.default.boolean().required(),
    driver5: joi_1.default.boolean().required(),
    rider10: joi_1.default.boolean().required(),
    rider5: joi_1.default.boolean().required(),
    driverArrived: joi_1.default.boolean().required(),
    riderArrived: joi_1.default.boolean().required(),
    bothArrived: joi_1.default.boolean().required()
});
// Live tracking data validation
exports.liveTrackingDataSchema = joi_1.default.object({
    tripId: joi_1.default.string().required(),
    driverLocation: exports.liveLocationSchema.required(),
    riderLocation: exports.liveLocationSchema.required(),
    pickupLocation: exports.locationSchema.required(),
    dropoffLocation: exports.locationSchema.required(),
    tripStatus: exports.tripStatusSchema.required(),
    notified: exports.notificationFlagsSchema.required(),
    driverId: joi_1.default.string().required(),
    riderId: joi_1.default.string().required(),
    routeId: joi_1.default.string().required(),
    createdAt: joi_1.default.number().required(),
    updatedAt: joi_1.default.number().required()
});
// Validation helper function
const validateRequest = (schema, data) => {
    const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
    if (error) {
        throw new Error(`Validation error: ${error.details.map(d => d.message).join(', ')}`);
    }
    return value;
};
exports.validateRequest = validateRequest;
//# sourceMappingURL=validation.js.map