"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegion = exports.isProduction = exports.getEnvVar = exports.functions = exports.admin = exports.db = void 0;
const admin = __importStar(require("firebase-admin"));
exports.admin = admin;
const functions = __importStar(require("firebase-functions"));
exports.functions = functions;
// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp();
}
// Export Firestore database instance
exports.db = admin.firestore();
// Configure Firestore settings for better performance
exports.db.settings({
    ignoreUndefinedProperties: true
});
// Helper function to get environment variables
const getEnvVar = (key) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
};
exports.getEnvVar = getEnvVar;
// Helper function to check if running in production
const isProduction = () => {
    return process.env.NODE_ENV === 'production' ||
        process.env.FUNCTIONS_EMULATOR !== 'true';
};
exports.isProduction = isProduction;
// Helper function to get region
const getRegion = () => {
    return process.env.FIREBASE_REGION || 'us-central1';
};
exports.getRegion = getRegion;
//# sourceMappingURL=firebase.js.map