import { RouteProposal, CreateRouteRequest, UpdateRouteRequest, ApiResponse, PaginatedResponse } from '../types';
export declare class RouteService {
    private routesCollection;
    private usersCollection;
    createRoute(driverId: string, routeData: CreateRouteRequest): Promise<ApiResponse<RouteProposal>>;
    getRoute(routeId: string): Promise<ApiResponse<RouteProposal>>;
    updateRoute(routeId: string, driverId: string, updateData: UpdateRouteRequest): Promise<ApiResponse<RouteProposal>>;
    deleteRoute(routeId: string, driverId: string): Promise<ApiResponse<void>>;
    getRoutes(filters?: any, pagination?: any): Promise<PaginatedResponse<RouteProposal>>;
    getRoutesByDriver(driverId: string, status?: string): Promise<ApiResponse<RouteProposal[]>>;
    voteOnRoute(routeId: string, userId: string, vote: 'upvote' | 'downvote'): Promise<ApiResponse<void>>;
    getNearbyRoutes(lat: number, lng: number, radiusKm?: number): Promise<ApiResponse<RouteProposal[]>>;
}
//# sourceMappingURL=routeService.d.ts.map