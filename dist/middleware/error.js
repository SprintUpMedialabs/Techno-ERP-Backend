"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = __importDefault(require("../config/logger"));
const formatResponse_1 = require("../utils/formatResponse");
const secrets_1 = require("../secrets");
const mailer_1 = require("../config/mailer");
const errorHandler = (err, req, res, next) => {
    var _a, _b, _c, _d;
    logger_1.default.error(`Error occurred during ${req.method} request to ${req.url} | Status: ${(_a = err.statusCode) !== null && _a !== void 0 ? _a : 500} | Message: ${(_b = err.message) !== null && _b !== void 0 ? _b : 'No error message'} | Stack: ${(_c = err.stack) !== null && _c !== void 0 ? _c : 'No stack trace'}`);
    if (!err.statusCode || err.statusCode === 500) {
        if (process.env.NODE_ENV) {
            (0, mailer_1.sendEmail)(secrets_1.DEVELOPER_EMAIL, 'Error in the application', err.message);
        }
    }
    // if statusCode is there it means that message will also be created by us
    // if statusCode is not there it means that message is not created by us its something else in this situation we want to send internal server error.
    let statusCode = (_d = err.statusCode) !== null && _d !== void 0 ? _d : 500;
    let message = err.statusCode ? err.message : 'Internal Server Error. Please try again later.';
    return (0, formatResponse_1.formatResponse)(res, statusCode, message, false, null, message);
};
exports.errorHandler = errorHandler;
