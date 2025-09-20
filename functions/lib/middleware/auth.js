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
exports.errorHandler = exports.cors = exports.rateLimit = exports.optionalAuth = exports.requireAdmin = exports.authenticateUser = void 0;
const firebase_1 = require("../config/firebase");
const helpers_1 = require("../utils/helpers");
// Authentication middleware
const authenticateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        const decodedToken = yield firebase_1.admin.auth().verifyIdToken(token);
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
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }
});
exports.authenticateUser = authenticateUser;
// Admin authorization middleware
const requireAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
            return;
        }
        // Check if user is admin
        const userIsAdmin = yield (0, helpers_1.isAdmin)(req.user.uid, firebase_1.admin);
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
    }
    catch (error) {
        console.error('Admin authorization error:', error);
        res.status(500).json({
            success: false,
            error: 'Authorization check failed'
        });
    }
});
exports.requireAdmin = requireAdmin;
// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        const decodedToken = yield firebase_1.admin.auth().verifyIdToken(token);
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
    }
    catch (error) {
        console.error('Optional authentication error:', error);
        // Token verification failed, continue without authentication
        next();
    }
});
exports.optionalAuth = optionalAuth;
// Rate limiting middleware (basic implementation)
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();
    return (req, res, next) => {
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
exports.rateLimit = rateLimit;
// CORS middleware
const cors = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    }
    else {
        next();
    }
};
exports.cors = cors;
// Error handling middleware
const errorHandler = (error, req, res, next) => {
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
exports.errorHandler = errorHandler;
//# sourceMappingURL=auth.js.map