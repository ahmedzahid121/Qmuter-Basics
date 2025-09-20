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
exports.calculateRideStats = exports.generateNotificationMessage = exports.isAdmin = exports.snapshotToArray = exports.docToObject = exports.createPaginatedQuery = exports.generatePagination = exports.sanitizeString = exports.isValidPhoneNumber = exports.isValidEmail = exports.generateRouteName = exports.getBadgeTier = exports.calculateMoneySaved = exports.calculateCO2Saved = exports.formatCurrency = exports.calculateCommunityScore = exports.isWithinRadius = exports.calculateDistance = exports.createTimestamp = exports.generateId = void 0;
const firestore_1 = require("firebase-admin/firestore");
const uuid_1 = require("uuid");
// Generate unique IDs
const generateId = () => (0, uuid_1.v4)();
exports.generateId = generateId;
// Create timestamps
const createTimestamp = () => firestore_1.Timestamp.now();
exports.createTimestamp = createTimestamp;
// Calculate distance between two points (Haversine formula)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
exports.calculateDistance = calculateDistance;
// Check if a point is within a radius of another point
const isWithinRadius = (centerLat, centerLng, pointLat, pointLng, radiusKm) => {
    const distance = (0, exports.calculateDistance)(centerLat, centerLng, pointLat, pointLng);
    return distance <= radiusKm;
};
exports.isWithinRadius = isWithinRadius;
// Calculate community score based on upvotes and downvotes
const calculateCommunityScore = (upvotes, downvotes) => {
    const total = upvotes + downvotes;
    if (total === 0)
        return 0;
    return Math.round(((upvotes - downvotes) / total) * 100);
};
exports.calculateCommunityScore = calculateCommunityScore;
// Format currency
const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase()
    }).format(amount);
};
exports.formatCurrency = formatCurrency;
// Calculate CO2 savings (rough estimate: 0.2 kg CO2 per km saved)
const calculateCO2Saved = (distanceKm) => {
    return Math.round(distanceKm * 0.2 * 100) / 100; // Round to 2 decimal places
};
exports.calculateCO2Saved = calculateCO2Saved;
// Calculate money saved (compared to public transport)
const calculateMoneySaved = (distanceKm, pricePerKm = 0.3) => {
    return Math.round(distanceKm * pricePerKm * 100) / 100;
};
exports.calculateMoneySaved = calculateMoneySaved;
// Determine badge tier based on total CO2 saved
const getBadgeTier = (totalCO2Saved) => {
    if (totalCO2Saved >= 500)
        return 'Eco Hero';
    if (totalCO2Saved >= 250)
        return 'Platinum';
    if (totalCO2Saved >= 100)
        return 'Gold';
    if (totalCO2Saved >= 50)
        return 'Silver';
    return 'Bronze';
};
exports.getBadgeTier = getBadgeTier;
// Generate route name suggestions
const generateRouteName = (startPoint, endPoint) => {
    const start = startPoint.split(',')[0].trim();
    const end = endPoint.split(',')[0].trim();
    return `${start} → ${end}`;
};
exports.generateRouteName = generateRouteName;
// Validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
// Validate phone number format
const isValidPhoneNumber = (phone) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{7,}$/;
    return phoneRegex.test(phone);
};
exports.isValidPhoneNumber = isValidPhoneNumber;
// Sanitize string input
const sanitizeString = (input) => {
    return input.trim().replace(/[<>]/g, '');
};
exports.sanitizeString = sanitizeString;
// Generate pagination info
const generatePagination = (total, page, limit) => {
    return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
    };
};
exports.generatePagination = generatePagination;
// Create Firestore query with pagination
const createPaginatedQuery = (query, page, limit, sortBy = 'createdAt', sortOrder = 'desc') => {
    const offset = (page - 1) * limit;
    return query
        .orderBy(sortBy, sortOrder)
        .limit(limit)
        .offset(offset);
};
exports.createPaginatedQuery = createPaginatedQuery;
// Convert Firestore document to plain object
const docToObject = (doc) => {
    if (!doc.exists)
        return null;
    return Object.assign({ id: doc.id }, doc.data());
};
exports.docToObject = docToObject;
// Convert Firestore query snapshot to array
const snapshotToArray = (snapshot) => {
    return snapshot.docs.map(doc => (0, exports.docToObject)(doc)).filter(Boolean);
};
exports.snapshotToArray = snapshotToArray;
// Check if user is admin
const isAdmin = (uid, admin) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userRecord = yield admin.auth().getUser(uid);
        return ((_a = userRecord.customClaims) === null || _a === void 0 ? void 0 : _a.role) === 'admin';
    }
    catch (error) {
        return false;
    }
});
exports.isAdmin = isAdmin;
// Generate notification message based on type
const generateNotificationMessage = (type, data) => {
    switch (type) {
        case 'route-approved':
            return {
                title: 'Route Approved! 🎉',
                message: `Your route "${data.routeName}" has been approved and is now active.`
            };
        case 'route-rejected':
            return {
                title: 'Route Update',
                message: `Your route "${data.routeName}" was not approved. ${data.reason || 'Please review and resubmit.'}`
            };
        case 'booking-confirmed':
            return {
                title: 'Booking Confirmed! ✅',
                message: `Your booking for "${data.routeName}" has been confirmed.`
            };
        case 'ride-reminder':
            return {
                title: 'Ride Reminder',
                message: `Don't forget! Your ride "${data.routeName}" is scheduled for ${data.time}.`
            };
        case 'payment-received':
            return {
                title: 'Payment Received',
                message: `Payment of ${(0, exports.formatCurrency)(data.amount, data.currency)} has been received.`
            };
        default:
            return {
                title: 'Notification',
                message: 'You have a new notification.'
            };
    }
};
exports.generateNotificationMessage = generateNotificationMessage;
// Calculate ride statistics
const calculateRideStats = (rides) => {
    return rides.reduce((stats, ride) => {
        const distance = (0, exports.calculateDistance)(ride.routeInfo.startPoint.lat, ride.routeInfo.startPoint.lng, ride.routeInfo.endPoint.lat, ride.routeInfo.endPoint.lng);
        return {
            totalRides: stats.totalRides + 1,
            totalCO2Saved: stats.totalCO2Saved + (0, exports.calculateCO2Saved)(distance),
            totalMoneySaved: stats.totalMoneySaved + (0, exports.calculateMoneySaved)(distance),
            totalRevenue: stats.totalRevenue + (ride.totalRevenue || 0)
        };
    }, {
        totalRides: 0,
        totalCO2Saved: 0,
        totalMoneySaved: 0,
        totalRevenue: 0
    });
};
exports.calculateRideStats = calculateRideStats;
//# sourceMappingURL=helpers.js.map