import { db, admin } from '../config/firebase';
import { 
  RouteProposal, 
  QmuterUser, 
  AdminAction, 
  AdminActionRequest,
  ApiResponse,
  PaginatedResponse 
} from '../types';
import { 
  validateRequest, 
  adminActionSchema,
  paginationSchema 
} from '../utils/validation';
import { 
  generateId, 
  createTimestamp, 
  isAdmin,
  generateNotificationMessage 
} from '../utils/helpers';

export class AdminService {
  private routesCollection = db.collection('routes');
  private usersCollection = db.collection('users');
  private adminActionsCollection = db.collection('adminActions');
  private notificationsCollection = db.collection('notifications');

  // Check if user is admin
  async checkAdminStatus(uid: string): Promise<boolean> {
    return await isAdmin(uid, admin);
  }

  // Get pending route proposals
  async getPendingRoutes(pagination: any = {}): Promise<PaginatedResponse<RouteProposal>> {
    try {
      const validatedPagination = validateRequest(paginationSchema, pagination);

      let query = this.routesCollection.where('status', '==', 'pending');
      
      // Get total count
      const totalSnapshot = await query.get();
      const total = totalSnapshot.size;

      // Apply pagination
      const snapshot = await query
        .orderBy('createdAt', 'desc')
        .limit(validatedPagination.limit)
        .offset((validatedPagination.page - 1) * validatedPagination.limit)
        .get();

      const routes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RouteProposal[];

      return {
        success: true,
        data: routes,
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
        error: error instanceof Error ? error.message : 'Failed to get pending routes',
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

  // Approve route proposal
  async approveRoute(routeId: string, adminId: string, notes?: string): Promise<ApiResponse<void>> {
    try {
      // Verify admin status
      const isUserAdmin = await this.checkAdminStatus(adminId);
      if (!isUserAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      // Get admin info
      const adminDoc = await this.usersCollection.doc(adminId).get();
      const adminData = adminDoc.data() as QmuterUser;

      await db.runTransaction(async (transaction) => {
        // Get route
        const routeRef = this.routesCollection.doc(routeId);
        const routeDoc = await transaction.get(routeRef);
        
        if (!routeDoc.exists) {
          throw new Error('Route not found');
        }

        const route = routeDoc.data() as RouteProposal;
        
        if (route.status !== 'pending') {
          throw new Error('Route is not pending approval');
        }

        // Update route status
        transaction.update(routeRef, {
          status: 'approved',
          adminNotes: notes,
          approvedBy: adminId,
          approvedAt: createTimestamp(),
          updatedAt: createTimestamp()
        });

        // Create admin action record
        const adminAction: AdminAction = {
          id: generateId(),
          adminId,
          adminInfo: {
            displayName: adminData.displayName,
            email: adminData.email || ''
          },
          action: 'approve-route',
          targetType: 'route',
          targetId: routeId,
          notes,
          createdAt: createTimestamp()
        };

        const adminActionRef = this.adminActionsCollection.doc(adminAction.id);
        transaction.set(adminActionRef, adminAction);

        // Create notification for driver
        const notification = {
          id: generateId(),
          userId: route.driverId,
          type: 'route-approved',
          title: 'Route Approved! 🎉',
          message: `Your route "${route.routeName}" has been approved and is now active.`,
          data: {
            routeId: route.id,
            routeName: route.routeName
          },
          read: false,
          createdAt: createTimestamp()
        };

        const notificationRef = this.notificationsCollection.doc(notification.id);
        transaction.set(notificationRef, notification);
      });

      return {
        success: true,
        message: 'Route approved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to approve route'
      };
    }
  }

  // Reject route proposal
  async rejectRoute(routeId: string, adminId: string, reason: string, notes?: string): Promise<ApiResponse<void>> {
    try {
      // Verify admin status
      const isUserAdmin = await this.checkAdminStatus(adminId);
      if (!isUserAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      // Get admin info
      const adminDoc = await this.usersCollection.doc(adminId).get();
      const adminData = adminDoc.data() as QmuterUser;

      await db.runTransaction(async (transaction) => {
        // Get route
        const routeRef = this.routesCollection.doc(routeId);
        const routeDoc = await transaction.get(routeRef);
        
        if (!routeDoc.exists) {
          throw new Error('Route not found');
        }

        const route = routeDoc.data() as RouteProposal;
        
        if (route.status !== 'pending') {
          throw new Error('Route is not pending approval');
        }

        // Update route status
        transaction.update(routeRef, {
          status: 'rejected',
          adminNotes: notes,
          approvedBy: adminId,
          approvedAt: createTimestamp(),
          updatedAt: createTimestamp()
        });

        // Create admin action record
        const adminAction: AdminAction = {
          id: generateId(),
          adminId,
          adminInfo: {
            displayName: adminData.displayName,
            email: adminData.email || ''
          },
          action: 'reject-route',
          targetType: 'route',
          targetId: routeId,
          reason,
          notes,
          createdAt: createTimestamp()
        };

        const adminActionRef = this.adminActionsCollection.doc(adminAction.id);
        transaction.set(adminActionRef, adminAction);

        // Create notification for driver
        const notification = {
          id: generateId(),
          userId: route.driverId,
          type: 'route-rejected',
          title: 'Route Update',
          message: `Your route "${route.routeName}" was not approved. ${reason}`,
          data: {
            routeId: route.id,
            routeName: route.routeName,
            reason
          },
          read: false,
          createdAt: createTimestamp()
        };

        const notificationRef = this.notificationsCollection.doc(notification.id);
        transaction.set(notificationRef, notification);
      });

      return {
        success: true,
        message: 'Route rejected successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reject route'
      };
    }
  }

  // Suspend user
  async suspendUser(userId: string, adminId: string, reason: string, notes?: string): Promise<ApiResponse<void>> {
    try {
      // Verify admin status
      const isUserAdmin = await this.checkAdminStatus(adminId);
      if (!isUserAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      // Get admin info
      const adminDoc = await this.usersCollection.doc(adminId).get();
      const adminData = adminDoc.data() as QmuterUser;

      await db.runTransaction(async (transaction) => {
        // Check if user exists
        const userRef = this.usersCollection.doc(userId);
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists) {
          throw new Error('User not found');
        }

        // Update user status in Firestore
        transaction.update(userRef, {
          suspended: true,
          suspendedAt: createTimestamp(),
          suspendedBy: adminId,
          suspensionReason: reason,
          updatedAt: createTimestamp()
        });

        // Set custom claims to suspend user
        await admin.auth().setCustomUserClaims(userId, { 
          suspended: true,
          suspensionReason: reason 
        });

        // Create admin action record
        const adminAction: AdminAction = {
          id: generateId(),
          adminId,
          adminInfo: {
            displayName: adminData.displayName,
            email: adminData.email || ''
          },
          action: 'suspend-user',
          targetType: 'user',
          targetId: userId,
          reason,
          notes,
          createdAt: createTimestamp()
        };

        const adminActionRef = this.adminActionsCollection.doc(adminAction.id);
        transaction.set(adminActionRef, adminAction);
      });

      return {
        success: true,
        message: 'User suspended successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to suspend user'
      };
    }
  }

  // Activate user
  async activateUser(userId: string, adminId: string, notes?: string): Promise<ApiResponse<void>> {
    try {
      // Verify admin status
      const isUserAdmin = await this.checkAdminStatus(adminId);
      if (!isUserAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      // Get admin info
      const adminDoc = await this.usersCollection.doc(adminId).get();
      const adminData = adminDoc.data() as QmuterUser;

      await db.runTransaction(async (transaction) => {
        // Check if user exists
        const userRef = this.usersCollection.doc(userId);
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists) {
          throw new Error('User not found');
        }

        // Update user status in Firestore
        transaction.update(userRef, {
          suspended: false,
          activatedAt: createTimestamp(),
          activatedBy: adminId,
          updatedAt: createTimestamp()
        });

        // Remove suspension from custom claims
        await admin.auth().setCustomUserClaims(userId, { 
          suspended: false 
        });

        // Create admin action record
        const adminAction: AdminAction = {
          id: generateId(),
          adminId,
          adminInfo: {
            displayName: adminData.displayName,
            email: adminData.email || ''
          },
          action: 'activate-user',
          targetType: 'user',
          targetId: userId,
          notes,
          createdAt: createTimestamp()
        };

        const adminActionRef = this.adminActionsCollection.doc(adminAction.id);
        transaction.set(adminActionRef, adminAction);
      });

      return {
        success: true,
        message: 'User activated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to activate user'
      };
    }
  }

  // Get admin actions
  async getAdminActions(pagination: any = {}): Promise<PaginatedResponse<AdminAction>> {
    try {
      const validatedPagination = validateRequest(paginationSchema, pagination);

      let query = this.adminActionsCollection;
      
      // Get total count
      const totalSnapshot = await query.get();
      const total = totalSnapshot.size;

      // Apply pagination
      const snapshot = await query
        .orderBy('createdAt', 'desc')
        .limit(validatedPagination.limit)
        .offset((validatedPagination.page - 1) * validatedPagination.limit)
        .get();

      const actions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminAction[];

      return {
        success: true,
        data: actions,
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
        error: error instanceof Error ? error.message : 'Failed to get admin actions',
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

  // Get system statistics
  async getSystemStats(): Promise<ApiResponse<any>> {
    try {
      // Get counts for different collections
      const [routesSnapshot, usersSnapshot, bookingsSnapshot] = await Promise.all([
        this.routesCollection.get(),
        this.usersCollection.get(),
        db.collection('bookings').get()
      ]);

      // Get pending routes count
      const pendingRoutesSnapshot = await this.routesCollection
        .where('status', '==', 'pending')
        .get();

      // Get suspended users count
      const suspendedUsersSnapshot = await this.usersCollection
        .where('suspended', '==', true)
        .get();

      const stats = {
        totalRoutes: routesSnapshot.size,
        pendingRoutes: pendingRoutesSnapshot.size,
        totalUsers: usersSnapshot.size,
        suspendedUsers: suspendedUsersSnapshot.size,
        totalBookings: bookingsSnapshot.size,
        activeRoutes: routesSnapshot.docs.filter(doc => 
          doc.data().status === 'active'
        ).length
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get system stats'
      };
    }
  }

  // Get users with pagination and filters
  async getUsers(filters: any = {}, pagination: any = {}): Promise<PaginatedResponse<QmuterUser>> {
    try {
      const validatedPagination = validateRequest(paginationSchema, pagination);

      let query = this.usersCollection as any;

      // Apply filters
      if (filters.role) {
        query = query.where('role', '==', filters.role);
      }

      if (filters.suspended !== undefined) {
        query = query.where('suspended', '==', filters.suspended);
      }

      // Get total count
      const totalSnapshot = await query.get();
      const total = totalSnapshot.size;

      // Apply pagination
      const snapshot = await query
        .orderBy('createdAt', 'desc')
        .limit(validatedPagination.limit)
        .offset((validatedPagination.page - 1) * validatedPagination.limit)
        .get();

      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QmuterUser[];

      return {
        success: true,
        data: users,
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
        error: error instanceof Error ? error.message : 'Failed to get users',
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
} 