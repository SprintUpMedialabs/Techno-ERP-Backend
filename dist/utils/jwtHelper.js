"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeToken = exports.verifyToken = exports.createToken = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const secrets_1 = require("../secrets");
/**
 * Generate a JWT token
 * @param payload - Data to be stored in the token
 * @param expiresIn - Expiry time (default: 1 hour)
 * @returns Signed JWT token
 */
const createToken = (payload, options) => {
    return jsonwebtoken_1.default.sign(payload, secrets_1.JWT_SECRET, options);
};
exports.createToken = createToken;
/**
 * Verify a JWT token
 * @param token - The token to verify
 * @returns Decoded token payload if valid, throws error if invalid
 */
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, secrets_1.JWT_SECRET);
    }
    catch (error) {
        throw (0, http_errors_1.default)(400, 'Invalid token');
    }
};
exports.verifyToken = verifyToken;
/**
 * Decode a JWT token (Does not verify signature)
 * @param token - The token to decode
 * @returns Decoded token payload or null if invalid
 */
const decodeToken = (token) => {
    try {
        return jsonwebtoken_1.default.decode(token);
    }
    catch (error) {
        throw (0, http_errors_1.default)(500, 'Invalid Token.');
    }
};
exports.decodeToken = decodeToken;
