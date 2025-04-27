import bcrypt from 'bcrypt';
import { CookieOptions, Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import createHttpError from 'http-errors';
import * as jwt from 'jsonwebtoken';
import { sendEmail } from '../../config/mailer';
import { AUTH_API_PATH, JWT_SECRET } from '../../secrets';
import { createToken, verifyToken } from '../../utils/jwtHelper';
import { User } from '../models/user';
import { VerifyOtp } from '../models/verifyOtp';
import { generateOTP } from '../utils/otpGenerator';
import {
  ILoginRequest,
  IOTPRequest,
  IRegisterationRequest,
  loginRequestSchema,
  OTPRequestSchema,
  registerationRequestSchema,
  forgotPasswordRequestSchema,
  IForgotPasswordRequest,
  IUpdatePasswordRequest,
  updatePasswordRequestSchema,
  IEmail,
  emailSchema
} from '../validators/authRequest';
import { formatResponse } from '../../utils/formatResponse';

// TODO: will apply rate limit here
export const sendOtpToEmail = expressAsyncHandler(async (req: Request, res: Response) => {
  const data: IEmail = req.body;

  const validation = emailSchema.safeParse(data);
  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const otp = generateOTP(10, 6);

  const emailBody = `
  <html>
    <body>
      <p><strong>Your OTP:</strong> <span style="background-color: #f3f3f3; padding: 5px; border-radius: 4px; font-size: 16px;">${otp.otpValue}</span></p>
      <p style="color: red;">It will expire in 10 minutes.</p>
    </body>
  </html>
`;

  await sendEmail(data.email, 'Your OTP for Registration', emailBody);

  await VerifyOtp.create({
    email: data.email,
    verifyOtp: parseInt(otp.otpValue),
    verifyOtpExpireAt: otp.otpExpiryTime
  });

  return formatResponse(res, 201, "OTP sent to your email", true);
});

export const validateAndVerifyOtp = expressAsyncHandler(async (req: Request, res: Response) => {
  const data: IOTPRequest = req.body;

  const validation = OTPRequestSchema.safeParse(data);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const otpRecord = await VerifyOtp.findOne({ email: data.email });
  if (!otpRecord) {
    throw createHttpError(400, 'OTP not found.');
  }

  if (otpRecord.verifyOtp !== data.otp) {
    throw createHttpError(400, 'Invalid OTP');
  }

  if (otpRecord.verifyOtpExpireAt < new Date()) {
    throw createHttpError(400, 'Expired OTP.');
  }

  const token = createToken({ email: data.email }, { expiresIn: '30m' });

  VerifyOtp.deleteOne({ email: data.email });

  return formatResponse(res, 200, "Email verified successfully", true, token);
});

export const register = expressAsyncHandler(async (req: Request, res: Response) => {
  const data: IRegisterationRequest = req.body;

  const validation = registerationRequestSchema.safeParse(data);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const { email } = verifyToken(data.token) as { email: string };

  const password = Math.random().toString(36).slice(-8);

  const newUser = await User.create({
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

  await sendEmail(email, 'Your Account Password', emailBody);

  return formatResponse(res, 201, 'Account created successfully', true, newUser);
});

export const login = expressAsyncHandler(async (req: Request, res: Response) => {
  const data: ILoginRequest = req.body;

  const validation = loginRequestSchema.safeParse(data);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const user = await User.findOne({ email: data.email });
  if (!user) {
    throw createHttpError(404, 'User not found. Please register first.');
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password!);
  if (!isPasswordValid) {
    throw createHttpError(400, 'Invalid password.');
  }

  const payload = {
    id: user._id,
    marketingSheet: user.marketingSheet,
    roles: user.roles
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15d' });

  const options: CookieOptions = {
    maxAge: 15 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  };

  res.cookie('token', token, options);

  return formatResponse(res, 200, 'Logged in successfully', true, {
    token: token,
    roles: user.roles,
    userData: {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email
    }
  })
});

export const logout = (req: Request, res: Response) => {
  res.cookie('token', '', {
    maxAge: 0,
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });

  return formatResponse(res, 200, 'Logged out successfully', true);
};

// TODO: will apply rate limit here
export const forgotPassword = expressAsyncHandler(async (req: Request, res: Response) => {
  const data: IForgotPasswordRequest = req.body;

  const validation = forgotPasswordRequestSchema.safeParse(data);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const user = await User.findOne({ email: data.email });

  if (!user) {
    throw createHttpError(404, 'User not found. Please register first.');
  }

  const token = createToken({ userId: user._id }, { expiresIn: '15m' });

  const resetLink = `${AUTH_API_PATH}/?token=${encodeURIComponent(token)}`;

  await sendEmail(
    data.email,
    'Reset Password Link',
    `
    <html>
      <body>
        <p>Your link to reset your password:</p>
        <p><a href="${resetLink}" style="color: blue; text-decoration: underline;">Click here to reset your password</a></p>
        <p>If the above link does not work, copy and paste the following URL into your browser:</p>
        <p>${resetLink}</p>
      </body>
    </html>
  `
  );

  return formatResponse(res, 200, 'Reset password sent successfully', true);
});

export const updatePassword = expressAsyncHandler(async (req: Request, res: Response) => {
  const token = req.query.token as string;
  const data: IUpdatePasswordRequest = req.body;

  const validation = updatePasswordRequestSchema.safeParse(data);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  if (!token) {
    throw createHttpError(400, 'Invalid reset link.');
  }

  const decoded = verifyToken(token) as { userId: string };

  await User.findByIdAndUpdate(decoded.userId, { password: data.password });

  return formatResponse(res, 200, 'Password updated successfully', true);
});


export const isAuthenticated = expressAsyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies.token;

  if (!token) {
    throw createHttpError(404, 'User not authenticated.');
  }

  const decoded = verifyToken(token) as { id: string };

  const user = await User.findById(decoded.id);
  if (!user) {
    throw createHttpError(404, 'User not found.');
  }
  return formatResponse(res, 200, 'User is authenticated', true,);
});
