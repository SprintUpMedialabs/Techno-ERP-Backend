import mongoose, { Document, Schema } from 'mongoose';
import createHttpError from 'http-errors';
import { COLLECTION_NAMES } from '../config/constants';

export interface IOtpData {
  email: string;
  otp: string;
  otpExpiry: Date;
}

export interface IOtpDocument extends IOtpData, Document {}

const otpSchema = new Schema<IOtpDocument>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },
    otp: {
      type: String,
      required: [true, 'OTP is required'],
    },
    otpExpiry: {
      type: Date,
      required: [true, 'OTP expiry date is required'],
    },
  },
  { timestamps: true }
);

// Optional: Add index to auto-remove expired OTPs if using TTL
otpSchema.index({ otpExpiry: 1 }, { expireAfterSeconds: 0 });

const handleOtpError = (error: any, next: Function) => {
  if (error.name === 'ValidationError') {
    const firstError = error.errors[Object.keys(error.errors)[0]];
    throw createHttpError(400, firstError.message);
  } else {
    next(error);
  }
};

otpSchema.post('save', function (error: any, doc: any, next: Function) {
  handleOtpError(error, next);
});

otpSchema.post('findOneAndUpdate', function (error: any, doc: any, next: Function) {
  handleOtpError(error, next);
});

export const OtpModel = mongoose.model<IOtpDocument>(COLLECTION_NAMES.OTP, otpSchema);
