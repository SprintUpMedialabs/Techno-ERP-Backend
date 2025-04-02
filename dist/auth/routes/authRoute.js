"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const jwtAuthenticationMiddleware_1 = require("../../middleware/jwtAuthenticationMiddleware");
exports.authRouter = express_1.default.Router();
/**
 * Input : email
 */
exports.authRouter.post('/send-otp', authController_1.sendOtpToEmail);
/**
 * Input : email, otp
 */
exports.authRouter.post('/verify-otp', authController_1.validateAndVerifyOtp);
/**
 * Input : token, firstName, lastName, roles
 */
exports.authRouter.post('/register', authController_1.register);
/**
 * Input : email, password
 */
exports.authRouter.post('/login', authController_1.login);
/*
 * Logout
 **/
exports.authRouter.get('/logout', jwtAuthenticationMiddleware_1.authenticate, authController_1.logout);
/*
 * Input : Email
 **/
exports.authRouter.post('/forgot-password', authController_1.forgotPassword);
/***
 * Update Password : Use token, input : new password
 */
exports.authRouter.post('/update-password', authController_1.updatePassword);
exports.authRouter.get('/is-authenticated', authController_1.isAuthenticated);
