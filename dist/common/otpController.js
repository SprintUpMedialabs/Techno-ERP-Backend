"use strict";
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
exports.validateOTP = exports.sendOTP = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const otp_1 = require("./otp");
const mailer_1 = require("../config/mailer");
const sendOTP = (email, subject, getBody) => __awaiter(void 0, void 0, void 0, function* () {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);
    const otpData = {
        email,
        otp,
        otpExpiry
    };
    yield (0, mailer_1.sendEmail)(email, subject, getBody(otp));
    yield otp_1.OtpModel.create(otpData);
    return true;
});
exports.sendOTP = sendOTP;
const validateOTP = (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
    const otpData = yield otp_1.OtpModel.findOne({ email, otp });
    if (!otpData) {
        throw (0, http_errors_1.default)(400, 'Invalid OTP');
    }
    if (otpData.otpExpiry < new Date()) {
        throw (0, http_errors_1.default)(400, 'OTP expired');
    }
    return true;
});
exports.validateOTP = validateOTP;
