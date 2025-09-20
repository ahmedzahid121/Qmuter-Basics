import express, { Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth';
import { validateRequest } from '../utils/validation';
import Joi from 'joi';
import { db } from '../config/firebase';
import { Timestamp } from 'firebase-admin/firestore';

const router = express.Router();

// Emergency data validation schema
const emergencyTriggerSchema = Joi.object({
  rideId: Joi.string().required(),
  triggeredBy: Joi.string().valid('rider', 'driver').required(),
  userId: Joi.string().required(),
  otherUserId: Joi.string().required(),
  location: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required()
  }).required(),
  pickupStop: Joi.string().required(),
  destinationStop: Joi.string().required(),
  timestamp: Joi.string().isoDate().required(),
  status: Joi.string().valid('active', 'resolved').required(),
  userProfile: Joi.object({
    displayName: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().optional()
  }).required(),
  rideMeta: Joi.object({
    distance: Joi.number().required(),
    duration: Joi.number().required(),
    zones: Joi.array().items(Joi.string()).required(),
    price: Joi.number().required()
  }).required()
});

// Admin action logging schema
const adminActionSchema = Joi.object({
  action: Joi.string().valid('resolve', 'view', 'contact', 'escalate').required(),
  notes: Joi.string().max(500).optional()
});

// Trigger emergency
router.post('/trigger', authenticateUser, validateRequest(emergencyTriggerSchema, 'body'), async (req: Request, res: Response) => {
  try {
    const emergencyData = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Create emergency record
    const emergencyRef = db.collection('emergencies').doc();
    const emergencyId = emergencyRef.id;

    const emergencyRecord = {
      ...emergencyData,
      emergencyId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      // Mask sensitive data for audit logs
      maskedUserProfile: {
        displayName: maskString(emergencyData.userProfile.displayName),
        email: maskEmail(emergencyData.userProfile.email),
        phoneNumber: emergencyData.userProfile.phoneNumber ? maskPhone(emergencyData.userProfile.phoneNumber) : undefined
      }
    };

    await emergencyRef.set(emergencyRecord);

    // Create admin log entry
    await db.collection('admin_logs').add({
      adminId: 'system',
      emergencyId,
      action: 'emergency_triggered',
      notes: `Emergency triggered by ${emergencyData.triggeredBy} during ride ${emergencyData.rideId}`,
      timestamp: Timestamp.now(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });

    // Send notification to safety team
    await sendEmergencyNotification(emergencyRecord);

    // Send user notification
    await sendUserNotification(emergencyData.userId, emergencyId);

    res.status(201).json({
      success: true,
      emergencyId,
      message: 'Emergency triggered successfully'
    });

  } catch (error) {
    console.error('Error triggering emergency:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger emergency'
    });
  }
});

// Resolve emergency
router.post('/:emergencyId/resolve', authenticateUser, validateRequest(adminActionSchema, 'body'), async (req: Request, res: Response) => {
  try {
    const { emergencyId } = req.params;
    const { action, notes } = req.body;
    const adminId = req.user?.uid;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Update emergency status
    await db.collection('emergencies').doc(emergencyId).update({
      status: 'resolved',
      resolvedAt: Timestamp.now(),
      resolvedBy: adminId,
      updatedAt: Timestamp.now()
    });

    // Create admin log entry
    await db.collection('admin_logs').add({
      adminId,
      emergencyId,
      action: 'resolve',
      notes: notes || 'Emergency resolved by user',
      timestamp: Timestamp.now(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });

    // Send resolution notification
    await sendResolutionNotification(emergencyId, adminId);

    res.json({
      success: true,
      message: 'Emergency resolved successfully'
    });

  } catch (error) {
    console.error('Error resolving emergency:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve emergency'
    });
  }
});

// Get emergency details (admin only)
router.get('/:emergencyId', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { emergencyId } = req.params;
    const user = req.user;

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const emergencyDoc = await db.collection('emergencies').doc(emergencyId).get();

    if (!emergencyDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Emergency not found'
      });
    }

    const emergencyData = emergencyDoc.data();

    // Create admin log entry for viewing
    await db.collection('admin_logs').add({
      adminId: user.uid,
      emergencyId,
      action: 'view',
      notes: 'Emergency details viewed',
      timestamp: Timestamp.now(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: emergencyData
    });

  } catch (error) {
    console.error('Error getting emergency details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get emergency details'
    });
  }
});

// Get all emergencies (admin only)
router.get('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { status, limit = 50 } = req.query;
    
    let query = db.collection('emergencies').orderBy('createdAt', 'desc');
    
    if (status) {
      query = query.where('status', '==', status);
    }

    const emergenciesSnapshot = await query.limit(Number(limit)).get();
    const emergencies = emergenciesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: emergencies
    });

  } catch (error) {
    console.error('Error getting emergencies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get emergencies'
    });
  }
});

// Get emergency logs (admin only)
router.get('/:emergencyId/logs', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { emergencyId } = req.params;
    const user = req.user;

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const logsSnapshot = await db.collection('admin_logs')
      .where('emergencyId', '==', emergencyId)
      .orderBy('timestamp', 'desc')
      .get();

    const logs = logsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: logs
    });

  } catch (error) {
    console.error('Error getting emergency logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get emergency logs'
    });
  }
});

// Admin action on emergency
router.post('/:emergencyId/action', authenticateUser, validateRequest(adminActionSchema, 'body'), async (req: Request, res: Response) => {
  try {
    const { emergencyId } = req.params;
    const { action, notes } = req.body;
    const adminId = req.user?.uid;

    if (!adminId || req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    // Create admin log entry
    await db.collection('admin_logs').add({
      adminId,
      emergencyId,
      action,
      notes: notes || `Admin action: ${action}`,
      timestamp: Timestamp.now(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });

    // Handle specific actions
    if (action === 'contact') {
      await sendContactNotification(emergencyId, adminId, notes);
    } else if (action === 'escalate') {
      await escalateEmergency(emergencyId, adminId, notes);
    }

    res.json({
      success: true,
      message: `Admin action '${action}' recorded successfully`
    });

  } catch (error) {
    console.error('Error recording admin action:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record admin action'
    });
  }
});

// Utility functions for data masking
function maskString(str: string): string {
  if (str.length <= 2) return str;
  return str.charAt(0) + '*'.repeat(str.length - 2) + str.charAt(str.length - 1);
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (local.length <= 2) return email;
  const maskedLocal = local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1);
  return `${maskedLocal}@${domain}`;
}

function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  return phone.substring(0, 2) + '*'.repeat(phone.length - 4) + phone.substring(phone.length - 2);
}

// Notification functions
async function sendEmergencyNotification(emergencyData: any) {
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
    await db.collection('notifications').add({
      type: 'emergency_alert',
      emergencyId: emergencyData.emergencyId,
      emailData,
      sentAt: Timestamp.now(),
      status: 'sent'
    });

  } catch (error) {
    console.error('Error sending emergency notification:', error);
  }
}

async function sendUserNotification(userId: string, emergencyId: string) {
  try {
    // Send push notification to user
    await db.collection('notifications').add({
      type: 'emergency_user_notification',
      userId,
      emergencyId,
      message: 'Emergency services have been notified. Help is on the way.',
      sentAt: Timestamp.now(),
      status: 'sent'
    });
  } catch (error) {
    console.error('Error sending user notification:', error);
  }
}

async function sendResolutionNotification(emergencyId: string, adminId: string) {
  try {
    await db.collection('notifications').add({
      type: 'emergency_resolved',
      emergencyId,
      adminId,
      message: 'Emergency has been resolved',
      sentAt: Timestamp.now(),
      status: 'sent'
    });
  } catch (error) {
    console.error('Error sending resolution notification:', error);
  }
}

async function sendContactNotification(emergencyId: string, adminId: string, notes: string) {
  try {
    await db.collection('notifications').add({
      type: 'emergency_contact',
      emergencyId,
      adminId,
      notes,
      sentAt: Timestamp.now(),
      status: 'sent'
    });
  } catch (error) {
    console.error('Error sending contact notification:', error);
  }
}

async function escalateEmergency(emergencyId: string, adminId: string, notes: string) {
  try {
    await db.collection('notifications').add({
      type: 'emergency_escalated',
      emergencyId,
      adminId,
      notes,
      sentAt: Timestamp.now(),
      status: 'sent'
    });
  } catch (error) {
    console.error('Error escalating emergency:', error);
  }
}

export default router; 