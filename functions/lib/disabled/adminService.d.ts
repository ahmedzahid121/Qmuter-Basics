import { RouteProposal, QmuterUser, AdminAction, ApiResponse, PaginatedResponse } from '../types';
export declare class AdminService {
    private routesCollection;
    private usersCollection;
    private adminActionsCollection;
    private notificationsCollection;
    checkAdminStatus(uid: string): Promise<boolean>;
    getPendingRoutes(pagination?: any): Promise<PaginatedResponse<RouteProposal>>;
    approveRoute(routeId: string, adminId: string, notes?: string): Promise<ApiResponse<void>>;
    rejectRoute(routeId: string, adminId: string, reason: string, notes?: string): Promise<ApiResponse<void>>;
    suspendUser(userId: string, adminId: string, reason: string, notes?: string): Promise<ApiResponse<void>>;
    activateUser(userId: string, adminId: string, notes?: string): Promise<ApiResponse<void>>;
    getAdminActions(pagination?: any): Promise<PaginatedResponse<AdminAction>>;
    getSystemStats(): Promise<ApiResponse<any>>;
    getUsers(filters?: any, pagination?: any): Promise<PaginatedResponse<QmuterUser>>;
}
//# sourceMappingURL=adminService.d.ts.map