"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const firebase_1 = require("../config/firebase");
const validation_1 = require("../utils/validation");
const helpers_1 = require("../utils/helpers");
class AdminService {
    constructor() {
        this.routesCollection = firebase_1.db.collection('routes');
        this.usersCollection = firebase_1.db.collection('users');
        this.adminActionsCollection = firebase_1.db.collection('adminActions');
        this.notificationsCollection = firebase_1.db.collection('notifications');
    }
    // Check if user is admin
    async checkAdminStatus(uid) {
        return await (0, helpers_1.isAdmin)(uid, firebase_1.admin);
    }
    // Get pending route proposals
    async getPendingRoutes(pagination = {}) {
        try {
            const validatedPagination = (0, validation_1.validateRequest)(validation_1.paginationSchema, pagination);
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
            const routes = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
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
        }
        catch (error) {
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
    async approveRoute(routeId, adminId, notes) {
        try {
            // Verify admin status
            const isUserAdmin = await this.checkAdminStatus(adminId);
            if (!isUserAdmin) {
                throw new Error('Unauthorized: Admin access required');
            }
            // Get admin info
            const adminDoc = await this.usersCollection.doc(adminId).get();
            const adminData = adminDoc.data();
            await firebase_1.db.runTransaction(async (transaction) => {
                // Get route
                const routeRef = this.routesCollection.doc(routeId);
                const routeDoc = await transaction.get(routeRef);
                if (!routeDoc.exists) {
                    throw new Error('Route not found');
                }
                const route = routeDoc.data();
                if (route.status !== 'pending') {
                    throw new Error('Route is not pending approval');
                }
                // Update route status
                transaction.update(routeRef, {
                    status: 'approved',
                    adminNotes: notes,
                    approvedBy: adminId,
                    approvedAt: (0, helpers_1.createTimestamp)(),
                    updatedAt: (0, helpers_1.createTimestamp)()
                });
                // Create admin action record
                const adminAction = {
                    id: (0, helpers_1.generateId)(),
                    adminId,
                    adminInfo: {
                        displayName: adminData.displayName,
                        email: adminData.email || ''
                    },
                    action: 'approve-route',
                    targetType: 'route',
                    targetId: routeId,
                    notes,
                    createdAt: (0, helpers_1.createTimestamp)()
                };
                const adminActionRef = this.adminActionsCollection.doc(adminAction.id);
                transaction.set(adminActionRef, adminAction);
                // Create notification for driver
                const notification = {
                    id: (0, helpers_1.generateId)(),
                    userId: route.driverId,
                    type: 'route-approved',
                    title: 'Route Approved! 🎉',
                    message: `Your route "${route.routeName}" has been approved and is now active.`,
                    data: {
                        routeId: route.id,
                        routeName: route.routeName
                    },
                    read: false,
                    createdAt: (0, helpers_1.createTimestamp)()
                };
                const notificationRef = this.notificationsCollection.doc(notification.id);
                transaction.set(notificationRef, notification);
            });
            return {
                success: true,
                message: 'Route approved successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to approve route'
            };
        }
    }
    // Reject route proposal
    async rejectRoute(routeId, adminId, reason, notes) {
        try {
            // Verify admin status
            const isUserAdmin = await this.checkAdminStatus(adminId);
            if (!isUserAdmin) {
                throw new Error('Unauthorized: Admin access required');
            }
            // Get admin info
            const adminDoc = await this.usersCollection.doc(adminId).get();
            const adminData = adminDoc.data();
            await firebase_1.db.runTransaction(async (transaction) => {
                // Get route
                const routeRef = this.routesCollection.doc(routeId);
                const routeDoc = await transaction.get(routeRef);
                if (!routeDoc.exists) {
                    throw new Error('Route not found');
                }
                const route = routeDoc.data();
                if (route.status !== 'pending') {
                    throw new Error('Route is not pending approval');
                }
                // Update route status
                transaction.update(routeRef, {
                    status: 'rejected',
                    adminNotes: notes,
                    approvedBy: adminId,
                    approvedAt: (0, helpers_1.createTimestamp)(),
                    updatedAt: (0, helpers_1.createTimestamp)()
                });
                // Create admin action record
                const adminAction = {
                    id: (0, helpers_1.generateId)(),
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
                    createdAt: (0, helpers_1.createTimestamp)()
                };
                const adminActionRef = this.adminActionsCollection.doc(adminAction.id);
                transaction.set(adminActionRef, adminAction);
                // Create notification for driver
                const notification = {
                    id: (0, helpers_1.generateId)(),
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
                    createdAt: (0, helpers_1.createTimestamp)()
                };
                const notificationRef = this.notificationsCollection.doc(notification.id);
                transaction.set(notificationRef, notification);
            });
            return {
                success: true,
                message: 'Route rejected successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to reject route'
            };
        }
    }
    // Suspend user
    async suspendUser(userId, adminId, reason, notes) {
        try {
            // Verify admin status
            const isUserAdmin = await this.checkAdminStatus(adminId);
            if (!isUserAdmin) {
                throw new Error('Unauthorized: Admin access required');
            }
            // Get admin info
            const adminDoc = await this.usersCollection.doc(adminId).get();
            const adminData = adminDoc.data();
            await firebase_1.db.runTransaction(async (transaction) => {
                // Check if user exists
                const userRef = this.usersCollection.doc(userId);
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) {
                    throw new Error('User not found');
                }
                // Update user status in Firestore
                transaction.update(userRef, {
                    suspended: true,
                    suspendedAt: (0, helpers_1.createTimestamp)(),
                    suspendedBy: adminId,
                    suspensionReason: reason,
                    updatedAt: (0, helpers_1.createTimestamp)()
                });
                // Set custom claims to suspend user
                await firebase_1.admin.auth().setCustomUserClaims(userId, {
                    suspended: true,
                    suspensionReason: reason
                });
                // Create admin action record
                const adminAction = {
                    id: (0, helpers_1.generateId)(),
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
                    createdAt: (0, helpers_1.createTimestamp)()
                };
                const adminActionRef = this.adminActionsCollection.doc(adminAction.id);
                transaction.set(adminActionRef, adminAction);
            });
            return {
                success: true,
                message: 'User suspended successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to suspend user'
            };
        }
    }
    // Activate user
    async activateUser(userId, adminId, notes) {
        try {
            // Verify admin status
            const isUserAdmin = await this.checkAdminStatus(adminId);
            if (!isUserAdmin) {
                throw new Error('Unauthorized: Admin access required');
            }
            // Get admin info
            const adminDoc = await this.usersCollection.doc(adminId).get();
            const adminData = adminDoc.data();
            await firebase_1.db.runTransaction(async (transaction) => {
                // Check if user exists
                const userRef = this.usersCollection.doc(userId);
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) {
                    throw new Error('User not found');
                }
                // Update user status in Firestore
                transaction.update(userRef, {
                    suspended: false,
                    activatedAt: (0, helpers_1.createTimestamp)(),
                    activatedBy: adminId,
                    updatedAt: (0, helpers_1.createTimestamp)()
                });
                // Remove suspension from custom claims
                await firebase_1.admin.auth().setCustomUserClaims(userId, {
                    suspended: false
                });
                // Create admin action record
                const adminAction = {
                    id: (0, helpers_1.generateId)(),
                    adminId,
                    adminInfo: {
                        displayName: adminData.displayName,
                        email: adminData.email || ''
                    },
                    action: 'activate-user',
                    targetType: 'user',
                    targetId: userId,
                    notes,
                    createdAt: (0, helpers_1.createTimestamp)()
                };
                const adminActionRef = this.adminActionsCollection.doc(adminAction.id);
                transaction.set(adminActionRef, adminAction);
            });
            return {
                success: true,
                message: 'User activated successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to activate user'
            };
        }
    }
    // Get admin actions
    async getAdminActions(pagination = {}) {
        try {
            const validatedPagination = (0, validation_1.validateRequest)(validation_1.paginationSchema, pagination);
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
            const actions = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
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
        }
        catch (error) {
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
    async getSystemStats() {
        try {
            // Get counts for different collections
            const [routesSnapshot, usersSnapshot, bookingsSnapshot] = await Promise.all([
                this.routesCollection.get(),
                this.usersCollection.get(),
                firebase_1.db.collection('bookings').get()
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
                activeRoutes: routesSnapshot.docs.filter(doc => doc.data().status === 'active').length
            };
            return {
                success: true,
                data: stats
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get system stats'
            };
        }
    }
    // Get users with pagination and filters
    async getUsers(filters = {}, pagination = {}) {
        try {
            const validatedPagination = (0, validation_1.validateRequest)(validation_1.paginationSchema, pagination);
            let query = this.usersCollection;
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
            const users = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
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
        }
        catch (error) {
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
exports.AdminService = AdminService;
//# sourceMappingURL=adminService.js.map