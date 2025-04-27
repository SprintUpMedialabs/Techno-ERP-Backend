"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatResponse = void 0;
const formatResponse = (res, statusCode, message, success, data, error) => {
    return res.status(statusCode).json({
        MESSAGE: message,
        SUCCESS: success,
        ERROR: error !== null && error !== void 0 ? error : null,
        DATA: data !== null && data !== void 0 ? data : null
    });
};
exports.formatResponse = formatResponse;
