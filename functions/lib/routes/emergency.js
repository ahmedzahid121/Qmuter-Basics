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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const joi_1 = __importDefault(require("joi"));
const firebase_1 = require("../config/firebase");
const firestore_1 = require("firebase-admin/firestore");
const router = express_1.default.Router();
// Emergency data validation schema
const emergencyTriggerSchema = joi_1.default.object({
    rideId: joi_1.default.string().required(),
    triggeredBy: joi_1.default.string().valid('rider', 'driver').required(),
    userId: joi_1.default.string().required(),
    otherUserId: joi_1.default.string().required(),
    location: joi_1.default.object({
        lat: joi_1.default.number().min(-90).max(90).required(),
        lng: joi_1.default.number().min(-180).max(180).required()
    }).required(),
    pickupStop: joi_1.default.string().required(),
    destinationStop: joi_1.default.string().required(),
    timestamp: joi_1.default.string().isoDate().required(),
    status: joi_1.default.string().valid('active', 'resolved').required(),
    userProfile: joi_1.default.object({
        displayName: joi_1.default.string().required(),
        email: joi_1.default.string().email().required(),
        phoneNumber: joi_1.default.string().optional()
    }).required(),
    rideMeta: joi_1.default.object({
        distance: joi_1.default.number().required(),
        duration: joi_1.default.number().required(),
        zones: joi_1.default.array().items(joi_1.default.string()).required(),
        price: joi_1.default.number().required()
    }).required()
});
// Admin action logging schema
const adminActionSchema = joi_1.default.object({
    action: joi_1.default.string().valid('resolve', 'view', 'contact', 'escalate').required(),
    notes: joi_1.default.string().max(500).optional()
});
// Trigger emergency
router.post('/trigger', auth_1.authenticateUser, (0, validation_1.validateRequest)(emergencyTriggerSchema, 'body'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const emergencyData = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        // Create emergency record
        const emergencyRef = firebase_1.db.collection('emergencies').doc();
        const emergencyId = emergencyRef.id;
        const emergencyRecord = Object.assign(Object.assign({}, emergencyData), { emergencyId, createdAt: firestore_1.Timestamp.now(), updatedAt: firestore_1.Timestamp.now(), 
            // Mask sensitive data for audit logs
            maskedUserProfile: {
                displayName: maskString(emergencyData.userProfile.displayName),
                email: maskEmail(emergencyData.userProfile.email),
                phoneNumber: emergencyData.userProfile.phoneNumber ? maskPhone(emergencyData.userProfile.phoneNumber) : undefined
            } });
        yield emergencyRef.set(emergencyRecord);
        // Create admin log entry
        yield firebase_1.db.collection('admin_logs').add({
            adminId: 'system',
            emergencyId,
            action: 'emergency_triggered',
            notes: `Emergency triggered by ${emergencyData.triggeredBy} during ride ${emergencyData.rideId}`,
            timestamp: firestore_1.Timestamp.now(),
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip
        });
        // Send notification to safety team
        yield sendEmergencyNotification(emergencyRecord);
        // Send user notification
        yield sendUserNotification(emergencyData.userId, emergencyId);
        res.status(201).json({
            success: true,
            emergencyId,
            message: 'Emergency triggered successfully'
        });
    }
    catch (error) {
        console.error('Error triggering emergency:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to trigger emergency'
        });
    }
}));
// Resolve emergency
router.post('/:emergencyId/resolve', auth_1.authenticateUser, (0, validation_1.validateRequest)(adminActionSchema, 'body'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { emergencyId } = req.params;
        const { action, notes } = req.body;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!adminId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        // Update emergency status
        yield firebase_1.db.collection('emergencies').doc(emergencyId).update({
            status: 'resolved',
            resolvedAt: firestore_1.Timestamp.now(),
            resolvedBy: adminId,
            updatedAt: firestore_1.Timestamp.now()
        });
        // Create admin log entry
        yield firebase_1.db.collection('admin_logs').add({
            adminId,
            emergencyId,
            action: 'resolve',
            notes: notes || 'Emergency resolved by user',
            timestamp: firestore_1.Timestamp.now(),
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip
        });
        // Send resolution notification
        yield sendResolutionNotification(emergencyId, adminId);
        res.json({
            success: true,
            message: 'Emergency resolved successfully'
        });
    }
    catch (error) {
        console.error('Error resolving emergency:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to resolve emergency'
        });
    }
}));
// Get emergency details (admin only)
router.get('/:emergencyId', auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { emergencyId } = req.params;
        const user = req.user;
        if (!user || user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }
        const emergencyDoc = yield firebase_1.db.collection('emergencies').doc(emergencyId).get();
        if (!emergencyDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Emergency not found'
            });
        }
        const emergencyData = emergencyDoc.data();
        // Create admin log entry for viewing
        yield firebase_1.db.collection('admin_logs').add({
            adminId: user.uid,
            emergencyId,
            action: 'view',
            notes: 'Emergency details viewed',
            timestamp: firestore_1.Timestamp.now(),
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip
        });
        res.json({
            success: true,
            data: emergencyData
        });
    }
    catch (error) {
        console.error('Error getting emergency details:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get emergency details'
        });
    }
}));
// Get all emergencies (admin only)
router.get('/', auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user || user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }
        const { status, limit = 50 } = req.query;
        let query = firebase_1.db.collection('emergencies').orderBy('createdAt', 'desc');
        if (status) {
            query = query.where('status', '==', status);
        }
        const emergenciesSnapshot = yield query.limit(Number(limit)).get();
        const emergencies = emergenciesSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.json({
            success: true,
            data: emergencies
        });
    }
    catch (error) {
        console.error('Error getting emergencies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get emergencies'
        });
    }
}));
// Get emergency logs (admin only)
router.get('/:emergencyId/logs', auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { emergencyId } = req.params;
        const user = req.user;
        if (!user || user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }
        const logsSnapshot = yield firebase_1.db.collection('admin_logs')
            .where('emergencyId', '==', emergencyId)
            .orderBy('timestamp', 'desc')
            .get();
        const logs = logsSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.json({
            success: true,
            data: logs
        });
    }
    catch (error) {
        console.error('Error getting emergency logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get emergency logs'
        });
    }
}));
// Admin action on emergency
router.post('/:emergencyId/action', auth_1.authenticateUser, (0, validation_1.validateRequest)(adminActionSchema, 'body'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { emergencyId } = req.params;
        const { action, notes } = req.body;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!adminId || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }
        // Create admin log entry
        yield firebase_1.db.collection('admin_logs').add({
            adminId,
            emergencyId,
            action,
            notes: notes || `Admin action: ${action}`,
            timestamp: firestore_1.Timestamp.now(),
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip
        });
        // Handle specific actions
        if (action === 'contact') {
            yield sendContactNotification(emergencyId, adminId, notes);
        }
        else if (action === 'escalate') {
            yield escalateEmergency(emergencyId, adminId, notes);
        }
        res.json({
            success: true,
            message: `Admin action '${action}' recorded successfully`
        });
    }
    catch (error) {
        console.error('Error recording admin action:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to record admin action'
        });
    }
}));
// Utility functions for data masking
function maskString(str) {
    if (str.length <= 2)
        return str;
    return str.charAt(0) + '*'.repeat(str.length - 2) + str.charAt(str.length - 1);
}
function maskEmail(email) {
    const [local, domain] = email.split('@');
    if (local.length <= 2)
        return email;
    const maskedLocal = local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1);
    return `${maskedLocal}@${domain}`;
}
function maskPhone(phone) {
    if (phone.length <= 4)
        return phone;
    return phone.substring(0, 2) + '*'.repeat(phone.length - 4) + phone.substring(phone.length - 2);
}
// Notification functions
function sendEmergencyNotification(emergencyData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Send email to safety team
            const emailData = {
                to: 'alerts@qmuter.nz',
                subject: `🚨 EMERGENCY ALERT - ${emergencyData.triggeredBy.toUpperCase()}`,
                html: `
        <h2>🚨 Emergency Alert</h2>
        <p><strong>Triggered by:</strong> ${emergencyData.triggeredBy}</p>
        <p><strong>Location:</strong> ${emergencyData.location.lat}, ${emergencyData.location.lng}</p>
        <p><strong>Ride ID:</strong> ${emergencyData.rideId}</p>
        <p><strong>Time:</strong> ${emergencyData.timestamp}</p>
        <p><strong>User:</strong> ${emergencyData.maskedUserProfile.displayName}</p>
        <p><strong>Route:</strong> ${emergencyData.pickupStop} → ${emergencyData.destinationStop}</p>
        <br>
        <p><strong>Emergency ID:</strong> ${emergencyData.emergencyId}</p>
        <p><strong>Admin Dashboard:</strong> https://admin.qmuter.nz/emergencies/${emergencyData.emergencyId}</p>
      `
            };
            // In production, use a proper email service like SendGrid
            console.log('Emergency notification email:', emailData);
            // For now, log to Firestore for tracking
            yield firebase_1.db.collection('notifications').add({
                type: 'emergency_alert',
                emergencyId: emergencyData.emergencyId,
                emailData,
                sentAt: firestore_1.Timestamp.now(),
                status: 'sent'
            });
        }
        catch (error) {
            console.error('Error sending emergency notification:', error);
        }
    });
}
function sendUserNotification(userId, emergencyId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Send push notification to user
            yield firebase_1.db.collection('notifications').add({
                type: 'emergency_user_notification',
                userId,
                emergencyId,
                message: 'Emergency services have been notified. Help is on the way.',
                sentAt: firestore_1.Timestamp.now(),
                status: 'sent'
            });
        }
        catch (error) {
            console.error('Error sending user notification:', error);
        }
    });
}
function sendResolutionNotification(emergencyId, adminId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield firebase_1.db.collection('notifications').add({
                type: 'emergency_resolved',
                emergencyId,
                adminId,
                message: 'Emergency has been resolved',
                sentAt: firestore_1.Timestamp.now(),
                status: 'sent'
            });
        }
        catch (error) {
            console.error('Error sending resolution notification:', error);
        }
    });
}
function sendContactNotification(emergencyId, adminId, notes) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield firebase_1.db.collection('notifications').add({
                type: 'emergency_contact',
                emergencyId,
                adminId,
                notes,
                sentAt: firestore_1.Timestamp.now(),
                status: 'sent'
            });
        }
        catch (error) {
            console.error('Error sending contact notification:', error);
        }
    });
}
function escalateEmergency(emergencyId, adminId, notes) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield firebase_1.db.collection('notifications').add({
                type: 'emergency_escalated',
                emergencyId,
                adminId,
                notes,
                sentAt: firestore_1.Timestamp.now(),
                status: 'sent'
            });
        }
        catch (error) {
            console.error('Error escalating emergency:', error);
        }
    });
}
exports.default = router;
//# sourceMappingURL=emergency.js.map