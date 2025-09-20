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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteService = void 0;
const firebase_1 = require("../config/firebase");
const validation_1 = require("../utils/validation");
const helpers_1 = require("../utils/helpers");
class RouteService {
    constructor() {
        this.routesCollection = firebase_1.db.collection('routes');
        this.usersCollection = firebase_1.db.collection('users');
    }
    // Create a new route proposal
    createRoute(driverId, routeData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Validate request data
                const validatedData = (0, validation_1.validateRequest)(validation_1.createRouteSchema, routeData);
                // Get driver info
                const driverDoc = yield this.usersCollection.doc(driverId).get();
                if (!driverDoc.exists) {
                    throw new Error('Driver not found');
                }
                const driverData = driverDoc.data();
                if ((driverData === null || driverData === void 0 ? void 0 : driverData.role) !== 'driver') {
                    throw new Error('User must be a driver to create routes');
                }
                // Generate route name if not provided
                const routeName = validatedData.routeName || (0, helpers_1.generateRouteName)(validatedData.startPoint.address, validatedData.endPoint.address);
                // Add IDs to pickup points
                const pickupPoints = validatedData.pickupPoints.map(point => (Object.assign(Object.assign({}, point), { id: (0, helpers_1.generateId)() })));
                const route = {
                    id: (0, helpers_1.generateId)(),
                    driverId,
                    driverInfo: {
                        displayName: driverData.displayName,
                        photoURL: driverData.photoURL,
                        rating: driverData.rating || 0
                    },
                    routeName,
                    description: validatedData.description,
                    startPoint: validatedData.startPoint,
                    endPoint: validatedData.endPoint,
                    pickupPoints,
                    schedule: validatedData.schedule,
                    totalSeats: validatedData.totalSeats,
                    pricePerSeat: validatedData.pricePerSeat,
                    currency: validatedData.currency,
                    status: 'pending',
                    upvotes: 0,
                    downvotes: 0,
                    communityScore: 0,
                    createdAt: (0, helpers_1.createTimestamp)(),
                    updatedAt: (0, helpers_1.createTimestamp)()
                };
                yield this.routesCollection.doc(route.id).set(route);
                return {
                    success: true,
                    data: route,
                    message: 'Route proposal created successfully'
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to create route'
                };
            }
        });
    }
    // Get route by ID
    getRoute(routeId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const routeDoc = yield this.routesCollection.doc(routeId).get();
                if (!routeDoc.exists) {
                    throw new Error('Route not found');
                }
                const route = (0, helpers_1.docToObject)(routeDoc);
                return {
                    success: true,
                    data: route
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to get route'
                };
            }
        });
    }
    // Update route
    updateRoute(routeId, driverId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Validate request data
                const validatedData = (0, validation_1.validateRequest)(validation_1.updateRouteSchema, updateData);
                // Check if route exists and belongs to driver
                const routeDoc = yield this.routesCollection.doc(routeId).get();
                if (!routeDoc.exists) {
                    throw new Error('Route not found');
                }
                const route = routeDoc.data();
                if (route.driverId !== driverId) {
                    throw new Error('Unauthorized to update this route');
                }
                if (route.status !== 'pending') {
                    throw new Error('Can only update pending routes');
                }
                // Add IDs to new pickup points if provided
                let pickupPoints = route.pickupPoints;
                if (validatedData.pickupPoints) {
                    pickupPoints = validatedData.pickupPoints.map(point => (Object.assign(Object.assign({}, point), { id: (0, helpers_1.generateId)() })));
                }
                const updatedRoute = Object.assign(Object.assign({}, validatedData), { pickupPoints, updatedAt: (0, helpers_1.createTimestamp)() });
                yield this.routesCollection.doc(routeId).update(updatedRoute);
                // Get updated route
                const updatedDoc = yield this.routesCollection.doc(routeId).get();
                const updatedRouteData = (0, helpers_1.docToObject)(updatedDoc);
                return {
                    success: true,
                    data: updatedRouteData,
                    message: 'Route updated successfully'
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to update route'
                };
            }
        });
    }
    // Delete route
    deleteRoute(routeId, driverId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if route exists and belongs to driver
                const routeDoc = yield this.routesCollection.doc(routeId).get();
                if (!routeDoc.exists) {
                    throw new Error('Route not found');
                }
                const route = routeDoc.data();
                if (route.driverId !== driverId) {
                    throw new Error('Unauthorized to delete this route');
                }
                if (route.status !== 'pending') {
                    throw new Error('Can only delete pending routes');
                }
                yield this.routesCollection.doc(routeId).delete();
                return {
                    success: true,
                    message: 'Route deleted successfully'
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to delete route'
                };
            }
        });
    }
    // Get routes with filters and pagination
    getRoutes() {
        return __awaiter(this, arguments, void 0, function* (filters = {}, pagination = {}) {
            try {
                // Validate filters and pagination
                const validatedFilters = (0, validation_1.validateRequest)(validation_1.routeFiltersSchema, filters);
                const validatedPagination = (0, validation_1.validateRequest)(validation_1.paginationSchema, pagination);
                let query = this.routesCollection;
                // Apply filters
                if (validatedFilters.status) {
                    query = query.where('status', '==', validatedFilters.status);
                }
                if (validatedFilters.driverId) {
                    query = query.where('driverId', '==', validatedFilters.driverId);
                }
                if (validatedFilters.minPrice !== undefined) {
                    query = query.where('pricePerSeat', '>=', validatedFilters.minPrice);
                }
                if (validatedFilters.maxPrice !== undefined) {
                    query = query.where('pricePerSeat', '<=', validatedFilters.maxPrice);
                }
                // Get total count
                const totalSnapshot = yield query.get();
                const total = totalSnapshot.size;
                // Apply pagination
                const paginatedQuery = (0, helpers_1.createPaginatedQuery)(query, validatedPagination.page, validatedPagination.limit, validatedPagination.sortBy, validatedPagination.sortOrder);
                const snapshot = yield paginatedQuery.get();
                const routes = (0, helpers_1.snapshotToArray)(snapshot);
                // Apply location filter if provided (client-side filtering for geospatial queries)
                let filteredRoutes = routes;
                if (validatedFilters.location) {
                    filteredRoutes = routes.filter(route => (0, helpers_1.isWithinRadius)(validatedFilters.location.lat, validatedFilters.location.lng, route.startPoint.lat, route.startPoint.lng, validatedFilters.location.radius));
                }
                return {
                    success: true,
                    data: filteredRoutes,
                    pagination: {
                        page: validatedPagination.page,
                        limit: validatedPagination.limit,
                        total,
                        totalPages: Math.ceil(total / validatedPagination.limit)
                    }
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to get routes',
                    data: [],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 0,
                        totalPages: 0
                    }
                };
            }
        });
    }
    // Get routes by driver
    getRoutesByDriver(driverId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let query = this.routesCollection.where('driverId', '==', driverId);
                if (status) {
                    query = query.where('status', '==', status);
                }
                const snapshot = yield query.orderBy('createdAt', 'desc').get();
                const routes = (0, helpers_1.snapshotToArray)(snapshot);
                return {
                    success: true,
                    data: routes
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to get driver routes',
                    data: []
                };
            }
        });
    }
    // Vote on route (upvote/downvote)
    voteOnRoute(routeId, userId, vote) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const routeRef = this.routesCollection.doc(routeId);
                yield firebase_1.db.runTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                    const routeDoc = yield transaction.get(routeRef);
                    if (!routeDoc.exists) {
                        throw new Error('Route not found');
                    }
                    const route = routeDoc.data();
                    // Update votes
                    const upvotes = vote === 'upvote' ? route.upvotes + 1 : route.upvotes;
                    const downvotes = vote === 'downvote' ? route.downvotes + 1 : route.downvotes;
                    const communityScore = (0, helpers_1.calculateCommunityScore)(upvotes, downvotes);
                    transaction.update(routeRef, {
                        upvotes,
                        downvotes,
                        communityScore,
                        updatedAt: (0, helpers_1.createTimestamp)()
                    });
                }));
                return {
                    success: true,
                    message: 'Vote recorded successfully'
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to vote on route'
                };
            }
        });
    }
    // Get nearby routes
    getNearbyRoutes(lat_1, lng_1) {
        return __awaiter(this, arguments, void 0, function* (lat, lng, radiusKm = 10) {
            try {
                // Get all active routes (this is a simplified approach)
                // In production, you'd use Firestore's geohashing or a geospatial service
                const snapshot = yield this.routesCollection
                    .where('status', '==', 'active')
                    .orderBy('createdAt', 'desc')
                    .get();
                const routes = (0, helpers_1.snapshotToArray)(snapshot);
                // Filter by distance (client-side filtering)
                const nearbyRoutes = routes.filter(route => (0, helpers_1.isWithinRadius)(lat, lng, route.startPoint.lat, route.startPoint.lng, radiusKm));
                return {
                    success: true,
                    data: nearbyRoutes
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to get nearby routes',
                    data: []
                };
            }
        });
    }
}
exports.RouteService = RouteService;
//# sourceMappingURL=routeService.js.map