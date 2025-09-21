"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.minimal = void 0;
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
// Simple health endpoint
app.get('/v1/health', (req, res) => {
    console.log('Health check endpoint called');
    res.json({
        success: true,
        message: 'Health check working',
        timestamp: new Date().toISOString()
    });
});
// 404 handler
app.use('*', (req, res) => {
    console.log('404 handler called for:', req.originalUrl);
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl
    });
});
exports.minimal = app;
//# sourceMappingURL=minimal.js.map