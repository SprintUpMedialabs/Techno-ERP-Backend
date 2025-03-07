import { CookieOptions, Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { IUser, userSchema } from '../validators/user';
import { sendEmail } from '../../config/mailer';
import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { AUTH_API_PATH, JWT_SECRET } from '../../secrets';
import { generateOTP } from '../utils/otpGenerator';
import { User } from '../models/user';
import { VerifyOtp } from '../models/verifyOtp';
import logger from '../../config/logger';

export const register = expressAsyncHandler(async (req: Request, res: Response) => {
  try {
    const user: IUser = req.body;

    const validation = userSchema.safeParse(user);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors });
      return;
    }

    const existingUser = await User.findOne({ email: user.email });
    if (existingUser) {
      res.status(400).json({ error: 'User already exists with this email.' });
      return;
    }

    const otp = generateOTP(10, 6);

    const newUser = await User.create({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: '',
      roles: user.roles
    });

    await VerifyOtp.create({
      _id: newUser._id,
      verifyOtp: parseInt(otp.otpValue),
      verifyOtpExpireAt: otp.otpExpiryTime
    });

    const emailBody = `
      <html>
        <body>
          <p><strong>Your OTP:</strong> <span style="background-color: #f3f3f3; padding: 5px; border-radius: 4px; font-size: 16px;">${otp.otpValue}</span></p>
          <p style="color: red;">It will expire in 10 minutes.</p>
        </body>
      </html>
    `;

    await sendEmail(user.email, 'Your OTP for Registration', emailBody);

    res.status(201).json({ message: 'OTP sent to your email.', userId: newUser._id });
  } catch (error) {
    logger.error('Error in register:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

export const verifyOtp = expressAsyncHandler(async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ error: 'Email and OTP are required.' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const otpRecord = await VerifyOtp.findById(user._id);
    if (!otpRecord) {
      res.status(400).json({ error: 'OTP not found.' });
      return;
    }

    if (otpRecord.verifyOtp !== parseInt(otp)) {
      res.status(400).json({ error: 'Invalid OTP.' });
      return;
    }

    if (otpRecord.verifyOtpExpireAt < new Date()) {
      res.status(400).json({ error: 'Expired OTP.' });
      return;
    }

    const password = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    await VerifyOtp.deleteOne({ _id: user._id });

    const emailBody = `
      <html>
        <body>
          <p>Your account has been created.</p>
          <p><strong>Your password:</strong> <span style="background-color: #f3f3f3; padding: 5px; border-radius: 4px;">${password}</span></p>
          <p>Please change it after logging in for security reasons.</p>
        </body>
      </html>
    `;

    await sendEmail(user.email, 'Your Account Password', emailBody);

    res
      .status(200)
      .json({ message: 'Account created successfully. Check your email for the password.' });
  } catch (error) {
    logger.error('Error in verifyOtp:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

export const login = expressAsyncHandler(async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: 'User not found. Please register first.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password!);
    if (!isPasswordValid) {
      res.status(400).json({ message: 'Invalid password.' });
      return;
    }

    const payload = {
      id: user._id,
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

    res.status(200).json({
      message: 'Login successful.',
      token: token,
      roles: user.roles,
      userData: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      }
    });
  } catch (error) {
    logger.error('Error in login:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

export const logout = (req: Request, res: Response) => {
  res.cookie('token', '', {
    maxAge: 0,
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });
  res.status(200).json({ message: 'Logged out successfully.' });
};

export const forgotPassword = expressAsyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404).json({ message: 'User not found. Please register first.' });
    return;
  }

  const token = jwt.sign({ userId: user._id, expiry: Date.now() + 15 * 60 * 1000 }, JWT_SECRET, {
    expiresIn: '15m'
  });

  const resetLink = `${AUTH_API_PATH}/?token=${encodeURIComponent(token)}`;
  await sendEmail(
    email,
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

  res.status(200).json({ message: 'Reset password email sent successfully.' });
});

export const updatePassword = expressAsyncHandler(async (req: Request, res: Response) => {
  const token = req.query.token as string;
  const { password } = req.body;

  if (!token) {
    res.status(400).json({ message: 'Invalid reset link.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; expiry: number };
    if (Date.now() > decoded.expiry) {
      res.status(400).json({ message: 'Reset link expired.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(decoded.userId, { password: hashedPassword });

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    logger.error('Error in updatePassword:', error);
    res.status(400).json({ message: 'Invalid or tampered reset link.' });
  }
});
