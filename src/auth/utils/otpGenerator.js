'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.generateOTP = void 0;
const otp_generator_1 = __importDefault(require('otp-generator'));
const generateOTP = (delay, length) => {
  const otp = otp_generator_1.default.generate(length, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false
  });
  const otpExpireAt = new Date();
  otpExpireAt.setMinutes(otpExpireAt.getMinutes() + delay);
  return {
    otpValue: otp,
    otpExpiryTime: otpExpireAt
  };
};
exports.generateOTP = generateOTP;
