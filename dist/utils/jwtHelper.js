"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentJwtHelper = exports.jwtHelper = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const secrets_1 = require("../secrets");
const createJwtHelper = (secret) => {
    return {
        createToken: (payload, options = { expiresIn: '15d' }) => {
            return jsonwebtoken_1.default.sign(payload, secret, options);
        },
        verifyToken: (token) => {
            try {
                return jsonwebtoken_1.default.verify(token, secret);
            }
            catch (_a) {
                throw (0, http_errors_1.default)(400, 'Invalid token');
            }
        },
        decodeToken: (token) => {
            try {
                return jsonwebtoken_1.default.decode(token);
            }
            catch (_a) {
                throw (0, http_errors_1.default)(500, 'Invalid token');
            }
        },
    };
};
exports.jwtHelper = createJwtHelper(secrets_1.JWT_SECRET);
exports.studentJwtHelper = createJwtHelper(secrets_1.STUDENT_JWT_SECRET);
