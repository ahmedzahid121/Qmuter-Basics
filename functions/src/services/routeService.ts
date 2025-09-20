import { db } from '../config/firebase';
import { 
  RouteProposal, 
  CreateRouteRequest, 
  UpdateRouteRequest,
  ApiResponse,
  PaginatedResponse 
} from '../types';
import { 
  validateRequest, 
  createRouteSchema, 
  updateRouteSchema,
  paginationSchema,
  routeFiltersSchema 
} from '../utils/validation';
import { 
  generateId, 
  createTimestamp, 
  calculateCommunityScore,
  generateRouteName,
  createPaginatedQuery,
  snapshotToArray,
  docToObject,
  isWithinRadius,
  calculateDistance
} from '../utils/helpers';

export class RouteService {
  private routesCollection = db.collection('routes');
  private usersCollection = db.collection('users');

  // Create a new route proposal
  async createRoute(driverId: string, routeData: CreateRouteRequest): Promise<ApiResponse<RouteProposal>> {
    try {
      // Validate request data
      const validatedData = validateRequest(createRouteSchema, routeData) as CreateRouteRequest;

      // Get driver info
      const driverDoc = await this.usersCollection.doc(driverId).get();
      if (!driverDoc.exists) {
        throw new Error('Driver not found');
      }

      const driverData = driverDoc.data();
      if (driverData?.role !== 'driver') {
        throw new Error('User must be a driver to create routes');
      }

      // Generate route name if not provided
      const routeName = validatedData.routeName || generateRouteName(
        validatedData.startPoint.address,
        validatedData.endPoint.address
      );

      // Add IDs to pickup points
      const pickupPoints = validatedData.pickupPoints.map(point => ({
        ...point,
        id: generateId()
      }));

      const route: RouteProposal = {
        id: generateId(),
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
        createdAt: createTimestamp(),
        updatedAt: createTimestamp()
      };

      await this.routesCollection.doc(route.id).set(route);

      return {
        success: true,
        data: route,
        message: 'Route proposal created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create route'
      };
    }
  }

  // Get route by ID
  async getRoute(routeId: string): Promise<ApiResponse<RouteProposal>> {
    try {
      const routeDoc = await this.routesCollection.doc(routeId).get();
      
      if (!routeDoc.exists) {
        throw new Error('Route not found');
      }

      const route = docToObject<RouteProposal>(routeDoc);
      
      return {
        success: true,
        data: route!
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get route'
      };
    }
  }

  // Update route
  async updateRoute(routeId: string, driverId: string, updateData: UpdateRouteRequest): Promise<ApiResponse<RouteProposal>> {
    try {
      // Validate request data
      const validatedData = validateRequest(updateRouteSchema, updateData) as UpdateRouteRequest;

      // Check if route exists and belongs to driver
      const routeDoc = await this.routesCollection.doc(routeId).get();
      if (!routeDoc.exists) {
        throw new Error('Route not found');
      }

      const route = routeDoc.data() as RouteProposal;
      if (route.driverId !== driverId) {
        throw new Error('Unauthorized to update this route');
      }

      if (route.status !== 'pending') {
        throw new Error('Can only update pending routes');
      }

      // Add IDs to new pickup points if provided
      let pickupPoints = route.pickupPoints;
      if (validatedData.pickupPoints) {
        pickupPoints = validatedData.pickupPoints.map(point => ({
          ...point,
          id: generateId()
        }));
      }

      const updatedRoute: Partial<RouteProposal> = {
        ...validatedData,
        pickupPoints,
        updatedAt: createTimestamp()
      };

      await this.routesCollection.doc(routeId).update(updatedRoute);

      // Get updated route
      const updatedDoc = await this.routesCollection.doc(routeId).get();
      const updatedRouteData = docToObject<RouteProposal>(updatedDoc);

      return {
        success: true,
        data: updatedRouteData!,
        message: 'Route updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update route'
      };
    }
  }

  // Delete route
  async deleteRoute(routeId: string, driverId: string): Promise<ApiResponse<void>> {
    try {
      // Check if route exists and belongs to driver
      const routeDoc = await this.routesCollection.doc(routeId).get();
      if (!routeDoc.exists) {
        throw new Error('Route not found');
      }

      const route = routeDoc.data() as RouteProposal;
      if (route.driverId !== driverId) {
        throw new Error('Unauthorized to delete this route');
      }

      if (route.status !== 'pending') {
        throw new Error('Can only delete pending routes');
      }

      await this.routesCollection.doc(routeId).delete();

      return {
        success: true,
        message: 'Route deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete route'
      };
    }
  }

  // Get routes with filters and pagination
  async getRoutes(filters: any = {}, pagination: any = {}): Promise<PaginatedResponse<RouteProposal>> {
    try {
      // Validate filters and pagination
      const validatedFilters = validateRequest(routeFiltersSchema, filters) as any;
      const validatedPagination = validateRequest(paginationSchema, pagination) as any;

      let query = this.routesCollection as any;

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
      const totalSnapshot = await query.get();
      const total = totalSnapshot.size;

      // Apply pagination
      const paginatedQuery = createPaginatedQuery(
        query,
        validatedPagination.page,
        validatedPagination.limit,
        validatedPagination.sortBy,
        validatedPagination.sortOrder
      );

      const snapshot = await paginatedQuery.get();
      const routes = snapshotToArray<RouteProposal>(snapshot);

      // Apply location filter if provided (client-side filtering for geospatial queries)
      let filteredRoutes = routes;
      if (validatedFilters.location) {
        filteredRoutes = routes.filter(route => 
          isWithinRadius(
            validatedFilters.location.lat,
            validatedFilters.location.lng,
            route.startPoint.lat,
            route.startPoint.lng,
            validatedFilters.location.radius
          )
        );
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
    } catch (error) {
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
  }

  // Get routes by driver
  async getRoutesByDriver(driverId: string, status?: string): Promise<ApiResponse<RouteProposal[]>> {
    try {
      let query = this.routesCollection.where('driverId', '==', driverId);
      
      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').get();
      const routes = snapshotToArray<RouteProposal>(snapshot);

      return {
        success: true,
        data: routes
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get driver routes',
        data: []
      };
    }
  }

  // Vote on route (upvote/downvote)
  async voteOnRoute(routeId: string, userId: string, vote: 'upvote' | 'downvote'): Promise<ApiResponse<void>> {
    try {
      const routeRef = this.routesCollection.doc(routeId);
      
      await db.runTransaction(async (transaction) => {
        const routeDoc = await transaction.get(routeRef);
        
        if (!routeDoc.exists) {
          throw new Error('Route not found');
        }

        const route = routeDoc.data() as RouteProposal;
        
        // Update votes
        const upvotes = vote === 'upvote' ? route.upvotes + 1 : route.upvotes;
        const downvotes = vote === 'downvote' ? route.downvotes + 1 : route.downvotes;
        const communityScore = calculateCommunityScore(upvotes, downvotes);

        transaction.update(routeRef, {
          upvotes,
          downvotes,
          communityScore,
          updatedAt: createTimestamp()
        });
      });

      return {
        success: true,
        message: 'Vote recorded successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to vote on route'
      };
    }
  }

  // Get nearby routes
  async getNearbyRoutes(lat: number, lng: number, radiusKm: number = 10): Promise<ApiResponse<RouteProposal[]>> {
    try {
      // Get all active routes (this is a simplified approach)
      // In production, you'd use Firestore's geohashing or a geospatial service
      const snapshot = await this.routesCollection
        .where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .get();

      const routes = snapshotToArray<RouteProposal>(snapshot);

      // Filter by distance (client-side filtering)
      const nearbyRoutes = routes.filter(route => 
        isWithinRadius(lat, lng, route.startPoint.lat, route.startPoint.lng, radiusKm)
      );

      return {
        success: true,
        data: nearbyRoutes
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get nearby routes',
        data: []
      };
    }
  }
} 