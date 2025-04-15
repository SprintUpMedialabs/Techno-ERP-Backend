import mongoose, { Document, Schema } from 'mongoose';
import { IVerifyOtp } from '../validators/verifyOtp';
import { COLLECTION_NAMES } from '../../config/constants';

interface IVerifyOtpDocument extends IVerifyOtp, Document {}

const verifyOtpSchema = new Schema<IVerifyOtpDocument>(
  {
    email: { type: String, required: true },
    verifyOtp: { type: Number, required: true },
    verifyOtpExpireAt: { type: Date, required: true }
  },
  { timestamps: true }
);

export const VerifyOtp = mongoose.model<IVerifyOtpDocument>(COLLECTION_NAMES.VERIFY_OTP, verifyOtpSchema);
