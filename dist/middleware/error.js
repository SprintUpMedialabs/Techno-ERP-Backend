"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = __importDefault(require("../config/logger"));
const errorHandler = (err, req, res, next) => {
    logger_1.default.error(`Error occurred during ${req.method} request to ${req.url} | Status: ${err.statusCode || 500} | Message: ${err.message || 'No error message'} | Stack: ${err.stack || 'No stack trace'}`);
    // if statusCode is there it means that message will also be created by us
    // if statusCode is not there it means that message is not created by us its something else in this situation we want to send internal server error.
    res.status(err.statusCode ? err.statusCode : 500).json({
        error: err.statusCode ? err.message : 'Internal Server Error.Please try again later.'
    });
};
exports.errorHandler = errorHandler;
