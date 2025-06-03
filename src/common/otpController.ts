import createHttpError from "http-errors";
import { OtpModel } from "./otp";
import { sendEmail } from "../config/mailer";

export const sendOTP = async (email: string,subject:string,getBody:(otp:string)=>string) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

    const otpData = {
        email,
        otp,
        otpExpiry
    }

    await sendEmail(email, subject, getBody(otp));

    await OtpModel.create(otpData);

    return true;
};

export const validateOTP = async (email: string, otp: string) => {

    const otpData = await OtpModel.findOne({ email, otp });

    if (!otpData) {
        throw createHttpError(400, 'Invalid OTP');
    }

    if (otpData.otpExpiry < new Date()) {
        throw createHttpError(400, 'OTP expired');
    }

    return true;
};