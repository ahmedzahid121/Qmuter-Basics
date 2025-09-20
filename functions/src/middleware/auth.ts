import { Request, Response, NextFunction } from 'express';
import { admin } from '../config/firebase';
import { isAdmin } from '../utils/helpers';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        role?: string;
        isAdmin?: boolean;
      };
    }
  }
}

// Authentication middleware
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided'
      });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Invalid token format'
      });
      return;
    }

    // Verify the token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Check if user is suspended
    if (decodedToken.suspended) {
      res.status(403).json({
        success: false,
        error: 'Account suspended',
        reason: decodedToken.suspensionReason
      });
      return;
    }

    // Add user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role,
      isAdmin: decodedToken.role === 'admin'
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// Admin authorization middleware
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin(req.user.uid, admin);
    
    if (!userIsAdmin) {
      res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
      return;
    }

    // Update user object with admin status
    req.user.isAdmin = true;
    
    next();
  } catch (error) {
    console.error('Admin authorization error:', error);
    res.status(500).json({
      success: false,
      error: 'Authorization check failed'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      next();
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      // Invalid token format, continue without authentication
      next();
      return;
    }

    // Verify the token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Check if user is suspended
    if (decodedToken.suspended) {
      res.status(403).json({
        success: false,
        error: 'Account suspended',
        reason: decodedToken.suspensionReason
      });
      return;
    }

    // Add user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role,
      isAdmin: decodedToken.role === 'admin'
    };

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    // Token verification failed, continue without authentication
    next();
  }
};

// Rate limiting middleware (basic implementation)
export const rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    // Clean up expired entries
    for (const [key, value] of requests.entries()) {
      if (now > value.resetTime) {
        requests.delete(key);
      }
    }

    // Get or create request count for this IP
    const requestData = requests.get(ip) || { count: 0, resetTime: now + windowMs };
    
    if (now > requestData.resetTime) {
      requestData.count = 0;
      requestData.resetTime = now + windowMs;
    }

    requestData.count++;
    requests.set(ip, requestData);

    // Check if rate limit exceeded
    if (requestData.count > maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
      });
      return;
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requestData.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(requestData.resetTime / 1000));

    next();
  };
};

// CORS middleware
export const cors = (req: Request, res: Response, next: NextFunction): void => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

// Error handling middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);

  // Handle validation errors
  if (error.message.includes('Validation error')) {
    res.status(400).json({
      success: false,
      error: error.message
    });
    return;
  }

  // Handle authentication errors
  if (error.message.includes('Unauthorized') || error.message.includes('Invalid token')) {
    res.status(401).json({
      success: false,
      error: error.message
    });
    return;
  }

  // Handle authorization errors
  if (error.message.includes('Admin access required') || error.message.includes('Forbidden')) {
    res.status(403).json({
      success: false,
      error: error.message
    });
    return;
  }

  // Handle not found errors
  if (error.message.includes('not found')) {
    res.status(404).json({
      success: false,
      error: error.message
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
}; 