"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simple = void 0;
const https_1 = require("firebase-functions/v2/https");
exports.simple = (0, https_1.onRequest)((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.path === '/v1/health') {
        console.log('Health check endpoint called');
        res.json({
            success: true,
            message: 'Health check working',
            timestamp: new Date().toISOString()
        });
        return;
    }
    if (req.path === '/v1/routes') {
        console.log('Routes endpoint called');
        res.json({
            success: true,
            message: 'Routes endpoint working',
            timestamp: new Date().toISOString()
        });
        return;
    }
    console.log('404 handler called for:', req.path);
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path
    });
});
//# sourceMappingURL=simple.js.map