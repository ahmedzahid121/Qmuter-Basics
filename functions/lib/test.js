"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.test = void 0;
const test = (req, res) => {
    console.log('Test function called');
    res.json({
        success: true,
        message: 'Test function working',
        timestamp: new Date().toISOString()
    });
};
exports.test = test;
//# sourceMappingURL=test.js.map