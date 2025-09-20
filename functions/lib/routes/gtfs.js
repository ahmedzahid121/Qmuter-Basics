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
const router = express_1.default.Router();
const AT_API_BASE = 'https://api.at.govt.nz/v2/gtfs';
// Rate limiting and caching configuration
const RATE_LIMITS = {
    stops: { calls: 0, lastReset: Date.now(), maxPerHour: 100 },
    routes: { calls: 0, lastReset: Date.now(), maxPerHour: 50 },
    agencies: { calls: 0, lastReset: Date.now(), maxPerHour: 20 }
};
const CACHE_DURATION = {
    stops: 24 * 60 * 60 * 1000, // 24 hours
    routes: 7 * 24 * 60 * 60 * 1000, // 7 days
    agencies: 30 * 24 * 60 * 60 * 1000 // 30 days
};
// Helper function to check rate limits
function checkRateLimit(endpoint) {
    const limit = RATE_LIMITS[endpoint];
    if (!limit)
        return true;
    const now = Date.now();
    if (now - limit.lastReset > 60 * 60 * 1000) { // Reset every hour
        limit.calls = 0;
        limit.lastReset = now;
    }
    if (limit.calls >= limit.maxPerHour) {
        return false;
    }
    limit.calls++;
    return true;
}
// Helper function to get cached data from Firestore
function getCachedData(key) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const doc = yield firebase_1.db.collection('gtfs_cache').doc(key).get();
            if (!doc.exists)
                return null;
            const data = doc.data();
            if (!data)
                return null;
            const expiresAt = new Date(data.expiresAt);
            if (expiresAt < new Date()) {
                // Cache expired, delete it
                yield firebase_1.db.collection('gtfs_cache').doc(key).delete();
                return null;
            }
            return data.data;
        }
        catch (error) {
            console.error('Error getting cached data:', error);
            return null;
        }
    });
}
// Helper function to cache data in Firestore
function cacheData(key, data, duration) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const expiresAt = new Date(Date.now() + duration);
            yield firebase_1.db.collection('gtfs_cache').doc(key).set({
                data,
                cachedAt: new Date().toISOString(),
                expiresAt: expiresAt.toISOString()
            });
        }
        catch (error) {
            console.error('Error caching data:', error);
        }
    });
}
// Helper function to make authenticated AT API requests
function makeATAPIRequest(endpoint, params) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const url = new URL(`${AT_API_BASE}${endpoint}`);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });
        }
        const apiKey = process.env.AT_API_KEY;
        if (!apiKey) {
            throw new Error('AT_API_KEY not configured');
        }
        const response = yield fetch(url.toString(), {
            headers: {
                'Ocp-Apim-Subscription-Key': apiKey,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            const errorData = yield response.json();
            throw new Error(`AT API Error: ${((_b = (_a = errorData.errors) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.detail) || response.statusText}`);
        }
        return response.json();
    });
}
// Log API usage for monitoring
function logAPIUsage(endpoint) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const today = new Date().toISOString().split('T')[0];
            const docRef = firebase_1.db.collection('api_usage').doc(today);
            yield docRef.set({
                [endpoint]: ((_a = (yield docRef.get()).data()) === null || _a === void 0 ? void 0 : _a[endpoint]) || 0 + 1,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        }
        catch (error) {
            console.error('Error logging API usage:', error);
        }
    });
}
// ===== CORE RIDE-SHARING ENDPOINTS =====
// Get all stops (for pickup/dropoff selection)
router.get('/stops', auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check rate limit
        if (!checkRateLimit('stops')) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded for stops endpoint'
            });
        }
        // Try to get cached data first
        const cachedData = yield getCachedData('stops');
        if (cachedData) {
            return res.json({ success: true, data: cachedData });
        }
        // Fetch fresh data from AT API
        const response = yield makeATAPIRequest('/stops');
        // Cache the data
        yield cacheData('stops', response.data, CACHE_DURATION.stops);
        // Log usage
        yield logAPIUsage('stops');
        res.json({ success: true, data: response.data });
    }
    catch (error) {
        console.error('Error fetching stops from AT API:', error);
        // Fallback to mock data for ride-sharing
        res.json({
            success: true,
            data: [
                {
                    stop_id: "100-56c57897",
                    stop_code: "100",
                    stop_name: "Papatoetoe Train Station",
                    stop_lat: -36.97766,
                    stop_lon: 174.84925,
                    location_type: 1
                },
                {
                    stop_id: "101-9ef61446",
                    stop_code: "101",
                    stop_name: "Otahuhu Train Station",
                    stop_lat: -36.94669,
                    stop_lon: 174.83321,
                    location_type: 1
                },
                {
                    stop_id: "102-a4eddeea",
                    stop_code: "102",
                    stop_name: "Penrose Train Station",
                    stop_lat: -36.91009,
                    stop_lon: 174.8157,
                    location_type: 1
                }
            ]
        });
    }
}));
// Search stops by name (for user search)
const searchStopsSchema = joi_1.default.object({
    query: joi_1.default.string().min(2).required()
});
router.get('/stops/search', auth_1.authenticateUser, (0, validation_1.validateRequest)(searchStopsSchema, 'query'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { query } = req.query;
        // Get all stops (cached or fresh)
        const stopsResponse = yield fetch('/api/gtfs/stops');
        const stopsData = yield stopsResponse.json();
        if (!stopsData.success) {
            throw new Error('Failed to get stops data');
        }
        const allStops = stopsData.data;
        const filteredStops = allStops.filter((stop) => stop.stop_name.toLowerCase().includes(query.toLowerCase()) ||
            stop.stop_code.toLowerCase().includes(query.toLowerCase()));
        res.json({ success: true, data: filteredStops });
    }
    catch (error) {
        console.error('Error searching stops:', error);
        res.status(500).json({ success: false, error: 'Failed to search stops' });
    }
}));
// Get stops near a location (for nearby pickup points)
const nearbyStopsSchema = joi_1.default.object({
    lat: joi_1.default.number().min(-90).max(90).required(),
    lng: joi_1.default.number().min(-180).max(180).required(),
    radius: joi_1.default.number().min(0.1).max(50).default(5)
});
router.get('/stops/nearby', auth_1.authenticateUser, (0, validation_1.validateRequest)(nearbyStopsSchema, 'query'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lat, lng, radius } = req.query;
        // Get all stops (cached or fresh)
        const stopsResponse = yield fetch('/api/gtfs/stops');
        const stopsData = yield stopsResponse.json();
        if (!stopsData.success) {
            throw new Error('Failed to get stops data');
        }
        const allStops = stopsData.data;
        const nearbyStops = allStops.filter((stop) => {
            const distance = calculateDistance(parseFloat(lat), parseFloat(lng), stop.stop_lat, stop.stop_lon);
            return distance <= parseFloat(radius);
        });
        res.json({ success: true, data: nearbyStops });
    }
    catch (error) {
        console.error('Error fetching nearby stops:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch nearby stops' });
    }
}));
// Get all routes (for route information)
router.get('/routes', auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check rate limit
        if (!checkRateLimit('routes')) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded for routes endpoint'
            });
        }
        // Try to get cached data first
        const cachedData = yield getCachedData('routes');
        if (cachedData) {
            return res.json({ success: true, data: cachedData });
        }
        // Fetch fresh data from AT API
        const response = yield makeATAPIRequest('/routes');
        // Cache the data
        yield cacheData('routes', response.data, CACHE_DURATION.routes);
        // Log usage
        yield logAPIUsage('routes');
        res.json({ success: true, data: response.data });
    }
    catch (error) {
        console.error('Error fetching routes from AT API:', error);
        // Fallback to mock data for ride-sharing
        res.json({
            success: true,
            data: [
                {
                    route_id: "101-202",
                    agency_id: "NZB",
                    route_short_name: "101",
                    route_long_name: "101",
                    route_type: 3
                },
                {
                    route_id: "105-202",
                    agency_id: "NZB",
                    route_short_name: "105",
                    route_long_name: "105",
                    route_type: 3
                },
                {
                    route_id: "GULF-209",
                    agency_id: "FGL",
                    route_short_name: "GULF",
                    route_long_name: "GULF",
                    route_type: 4,
                    route_color: "00B1BF"
                }
            ]
        });
    }
}));
// Get routes by type (Bus, Train, Ferry)
router.get('/routes/type/:type', auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.params;
        // Get all routes (cached or fresh)
        const routesResponse = yield fetch('/api/gtfs/routes');
        const routesData = yield routesResponse.json();
        if (!routesData.success) {
            throw new Error('Failed to get routes data');
        }
        const allRoutes = routesData.data;
        const filteredRoutes = allRoutes.filter((route) => route.route_type === parseInt(type));
        res.json({ success: true, data: filteredRoutes });
    }
    catch (error) {
        console.error(`Error fetching routes by type ${req.params.type}:`, error);
        res.status(500).json({ success: false, error: 'Failed to fetch routes by type' });
    }
}));
// Get routes by short name (specific route numbers)
router.get('/routes/shortname/:shortName', auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { shortName } = req.params;
        const response = yield makeATAPIRequest('/routes', { 'filter[route_short_name]': shortName });
        res.json({
            success: true,
            data: response.data.map((item) => item.attributes)
        });
    }
    catch (error) {
        console.error(`Error fetching routes by short name ${req.params.shortName}:`, error);
        res.status(500).json({ success: false, error: 'Failed to fetch routes by short name' });
    }
}));
// Get agencies (transport operators)
router.get('/agencies', auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check rate limit
        if (!checkRateLimit('agencies')) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded for agencies endpoint'
            });
        }
        // Try to get cached data first
        const cachedData = yield getCachedData('agencies');
        if (cachedData) {
            return res.json({ success: true, data: cachedData });
        }
        // Fetch fresh data from AT API
        const response = yield makeATAPIRequest('/agencies');
        // Cache the data
        yield cacheData('agencies', response.data, CACHE_DURATION.agencies);
        // Log usage
        yield logAPIUsage('agencies');
        res.json({ success: true, data: response.data });
    }
    catch (error) {
        console.error('Error fetching agencies from AT API:', error);
        // Fallback to mock data
        res.json({
            success: true,
            data: [
                {
                    agency_id: "AM",
                    agency_name: "AT Metro",
                    agency_url: "http://www.aucklandtransport.govt.nz",
                    agency_timezone: "Pacific/Auckland",
                    agency_lang: "en",
                    agency_phone: "(09)355-3553"
                },
                {
                    agency_id: "FGL",
                    agency_name: "Fullers360",
                    agency_url: "http://www.aucklandtransport.govt.nz",
                    agency_timezone: "Pacific/Auckland",
                    agency_lang: "en",
                    agency_phone: "(09)355-3553"
                },
                {
                    agency_id: "NZB",
                    agency_name: "New Zealand Bus",
                    agency_url: "http://www.aucklandtransport.govt.nz",
                    agency_timezone: "Pacific/Auckland",
                    agency_lang: "en",
                    agency_phone: "(09)355-3553"
                }
            ]
        });
    }
}));
// ===== RIDE-SHARING SPECIFIC ENDPOINTS =====
// Get popular routes (bus routes for ride-sharing)
router.get('/routes/popular', auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get bus routes (type 3) which are most popular for ride-sharing
        const response = yield makeATAPIRequest('/routes', { 'filter[route_type]': '3' });
        const busRoutes = response.data.map((item) => item.attributes);
        // Sort by route_short_name and limit to top 20
        const popularRoutes = busRoutes
            .sort((a, b) => {
            const aNum = parseInt(a.route_short_name) || 0;
            const bNum = parseInt(b.route_short_name) || 0;
            return aNum - bNum;
        })
            .slice(0, 20);
        res.json({ success: true, data: popularRoutes });
    }
    catch (error) {
        console.error('Error fetching popular routes:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch popular routes' });
    }
}));
// Get ferry routes (for island connections)
router.get('/routes/ferry', auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield makeATAPIRequest('/routes', { 'filter[route_type]': '4' });
        res.json({
            success: true,
            data: response.data.map((item) => item.attributes)
        });
    }
    catch (error) {
        console.error('Error fetching ferry routes:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch ferry routes' });
    }
}));
// Get train routes (for longer distance connections)
router.get('/routes/train', auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield makeATAPIRequest('/routes', { 'filter[route_type]': '2' });
        res.json({
            success: true,
            data: response.data.map((item) => item.attributes)
        });
    }
    catch (error) {
        console.error('Error fetching train routes:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch train routes' });
    }
}));
// Get stops for a specific route (for pickup/dropoff points)
router.get('/routes/:routeId/stops', auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { routeId } = req.params;
        // Try to get cached data first
        const cachedData = yield getCachedData(`route_stops_${routeId}`);
        if (cachedData) {
            return res.json({ success: true, data: cachedData });
        }
        // Fetch fresh data from AT API
        const response = yield makeATAPIRequest(`/routes/${routeId}/stops`);
        // Cache the data
        yield cacheData(`route_stops_${routeId}`, response.data, CACHE_DURATION.stops);
        res.json({ success: true, data: response.data });
    }
    catch (error) {
        console.error(`Error fetching stops for route ${req.params.routeId}:`, error);
        res.status(500).json({ success: false, error: 'Failed to fetch route stops' });
    }
}));
// Get specific stop by ID
router.get('/stops/:stopId', auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { stopId } = req.params;
        // Try to get cached data first
        const cachedData = yield getCachedData(`stop_${stopId}`);
        if (cachedData) {
            return res.json({ success: true, data: cachedData });
        }
        // Fetch fresh data from AT API
        const response = yield makeATAPIRequest(`/stops/${stopId}`);
        // Cache the data
        yield cacheData(`stop_${stopId}`, response.data, CACHE_DURATION.stops);
        res.json({ success: true, data: response.data });
    }
    catch (error) {
        console.error(`Error fetching stop ${req.params.stopId}:`, error);
        res.status(404).json({ success: false, error: 'Stop not found' });
    }
}));
// Get specific route by ID
router.get('/routes/:routeId', auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { routeId } = req.params;
        // Try to get cached data first
        const cachedData = yield getCachedData(`route_${routeId}`);
        if (cachedData) {
            return res.json({ success: true, data: cachedData });
        }
        // Fetch fresh data from AT API
        const response = yield makeATAPIRequest(`/routes/${routeId}`);
        // Cache the data
        yield cacheData(`route_${routeId}`, response.data, CACHE_DURATION.routes);
        res.json({ success: true, data: response.data });
    }
    catch (error) {
        console.error(`Error fetching route ${req.params.routeId}:`, error);
        res.status(404).json({ success: false, error: 'Route not found' });
    }
}));
// Utility function to calculate distance between two points
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = deg2rad(lat2 - lat1);
    const dLng = deg2rad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
exports.default = router;
//# sourceMappingURL=gtfs.js.map