"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = exports.updatePassword = exports.forgotPassword = exports.logout = exports.login = exports.register = exports.validateAndVerifyOtp = exports.sendOtpToEmail = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const jwt = __importStar(require("jsonwebtoken"));
const mailer_1 = require("../../config/mailer");
const secrets_1 = require("../../secrets");
const jwtHelper_1 = require("../../utils/jwtHelper");
const user_1 = require("../models/user");
const verifyOtp_1 = require("../models/verifyOtp");
const otpGenerator_1 = require("../utils/otpGenerator");
const authRequest_1 = require("../validators/authRequest");
const formatResponse_1 = require("../../utils/formatResponse");
// TODO: will apply rate limit here
exports.sendOtpToEmail = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = req.body;
    const validation = authRequest_1.emailSchema.safeParse(data);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const otp = (0, otpGenerator_1.generateOTP)(10, 6);
    const emailBody = `
  <html>
    <body>
      <p><strong>Your OTP:</strong> <span style="background-color: #f3f3f3; padding: 5px; border-radius: 4px; font-size: 16px;">${otp.otpValue}</span></p>
      <p style="color: red;">It will expire in 10 minutes.</p>
    </body>
  </html>
`;
    yield (0, mailer_1.sendEmail)(data.email, 'Your OTP for Registration', emailBody);
    yield verifyOtp_1.VerifyOtp.create({
        email: data.email,
        verifyOtp: parseInt(otp.otpValue),
        verifyOtpExpireAt: otp.otpExpiryTime
    });
    return (0, formatResponse_1.formatResponse)(res, 201, "OTP sent to your email", true);
}));
exports.validateAndVerifyOtp = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = req.body;
    const validation = authRequest_1.OTPRequestSchema.safeParse(data);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const otpRecord = yield verifyOtp_1.VerifyOtp.findOne({ email: data.email });
    if (!otpRecord) {
        throw (0, http_errors_1.default)(400, 'OTP not found.');
    }
    if (otpRecord.verifyOtp !== data.otp) {
        throw (0, http_errors_1.default)(400, 'Invalid OTP');
    }
    if (otpRecord.verifyOtpExpireAt < new Date()) {
        throw (0, http_errors_1.default)(400, 'Expired OTP.');
    }
    const token = (0, jwtHelper_1.createToken)({ email: data.email }, { expiresIn: '30m' });
    verifyOtp_1.VerifyOtp.deleteOne({ email: data.email });
    return (0, formatResponse_1.formatResponse)(res, 200, "Email verified successfully", true, token);
}));
exports.register = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = req.body;
    const validation = authRequest_1.registerationRequestSchema.safeParse(data);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const { email } = (0, jwtHelper_1.verifyToken)(data.token);
    const password = Math.random().toString(36).slice(-8);
    const newUser = yield user_1.User.create({
        email,
        firstName: data.firstName,
        lastName: data.lastName,
        password,
        roles: data.roles
    });
    const emailBody = `
      <html>
        <body>
          <p>Your account has been created.</p>
          <p><strong>Your password:</strong> <span style="background-color: #f3f3f3; padding: 5px; border-radius: 4px;">${password}</span></p>
          <p>Please change it after logging in for security reasons.</p>
        </body>
      </html>
    `;
    yield (0, mailer_1.sendEmail)(email, 'Your Account Password', emailBody);
    return (0, formatResponse_1.formatResponse)(res, 201, 'Account created successfully', true, newUser);
}));
exports.login = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = req.body;
    const validation = authRequest_1.loginRequestSchema.safeParse(data);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const user = yield user_1.User.findOne({ email: data.email });
    if (!user) {
        throw (0, http_errors_1.default)(404, 'User not found. Please register first.');
    }
    const isPasswordValid = yield bcrypt_1.default.compare(data.password, user.password);
    if (!isPasswordValid) {
        throw (0, http_errors_1.default)(400, 'Invalid password.');
    }
    const payload = {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        roles: user.roles
    };
    const token = jwt.sign(payload, secrets_1.JWT_SECRET, { expiresIn: '15d' });
    const options = {
        maxAge: 15 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    };
    res.cookie('token', token, options);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Logged in successfully', true, {
        token: token,
        roles: user.roles,
        userData: {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email
        }
    });
}));
const logout = (req, res) => {
    res.cookie('token', '', {
        maxAge: 0,
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    });
    return (0, formatResponse_1.formatResponse)(res, 200, 'Logged out successfully', true);
};
exports.logout = logout;
// TODO: will apply rate limit here
exports.forgotPassword = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = req.body;
    const validation = authRequest_1.forgotPasswordRequestSchema.safeParse(data);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const user = yield user_1.User.findOne({ email: data.email });
    if (!user) {
        throw (0, http_errors_1.default)(404, 'User not found. Please register first.');
    }
    const token = (0, jwtHelper_1.createToken)({ userId: user._id }, { expiresIn: '15m' });
    const resetLink = `${secrets_1.AUTH_API_PATH}/?token=${encodeURIComponent(token)}`;
    yield (0, mailer_1.sendEmail)(data.email, 'Reset Password Link', `
    <html>
      <body>
        <p>Your link to reset your password:</p>
        <p><a href="${resetLink}" style="color: blue; text-decoration: underline;">Click here to reset your password</a></p>
        <p>If the above link does not work, copy and paste the following URL into your browser:</p>
        <p>${resetLink}</p>
      </body>
    </html>
  `);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Reset password sent successfully', true);
}));
exports.updatePassword = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.query.token;
    const data = req.body;
    const validation = authRequest_1.updatePasswordRequestSchema.safeParse(data);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    if (!token) {
        throw (0, http_errors_1.default)(400, 'Invalid reset link.');
    }
    const decoded = (0, jwtHelper_1.verifyToken)(token);
    yield user_1.User.findByIdAndUpdate(decoded.userId, { password: data.password });
    return (0, formatResponse_1.formatResponse)(res, 200, 'Password updated successfully', true);
}));
exports.isAuthenticated = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies.token;
    if (!token) {
        throw (0, http_errors_1.default)(404, 'User not authenticated.');
    }
    const decoded = (0, jwtHelper_1.verifyToken)(token);
    const user = yield user_1.User.findById(decoded.id);
    if (!user) {
        throw (0, http_errors_1.default)(404, 'User not found.');
    }
    return (0, formatResponse_1.formatResponse)(res, 200, 'User is authenticated', true);
}));
