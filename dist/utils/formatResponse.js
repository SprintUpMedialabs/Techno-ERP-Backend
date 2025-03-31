"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatResponse = void 0;
const formatResponse = (res, statusCode, message, success, data, error) => {
    return res.status(statusCode).json({
        MESSAGE: message,
        SUCCESS: success,
        ERROR: error || null,
        DATA: data || null
    });
};
exports.formatResponse = formatResponse;
