import { Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';
import { userSchema } from '../validators/user';
import { RegisterUser } from '../types/user.type';
import { sendEmail } from '../../config/mailer';
import otpGenerator from 'otp-generator';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const register = expressAsyncHandler(async (req: Request, res: Response) => {
  try {
    const user: RegisterUser = req.body;

    const validation = userSchema.safeParse(user);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors });
      return;
    }

    const otp = otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false
    });

    const otpExpireAt = new Date();
    otpExpireAt.setMinutes(otpExpireAt.getMinutes() + 10);

    const newUser = await prisma.user.create({
      data: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        password: '',
        verifyOtp: parseInt(otp),
        verifyOtpExpireAt: otpExpireAt
      }
    });

    await sendEmail(
      user.email,
      'Your OTP for Registration',
      `Your OTP is: ${otp}. It will expire in 10 minutes.`
    );

    res.status(201).json({ message: 'OTP sent to your email.', userId: newUser.id });
  } catch (error) {
    console.error('Error in register:', error);
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

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (user.verifyOtp !== parseInt(otp)) {
      res.status(400).json({ error: 'Invalid OTP.' });
      return;
    }

    if (user.verifyOtpExpireAt < new Date()) {
      res.status(400).json({ error: 'Expired OTP.' });
      return;
    }

    const password = Math.random().toString(36).slice(-8);

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword
      }
    });

    await sendEmail(
      user.email,
      'Your Account Password',
      `Your account has been created. Your password is: ${password}. Please change it after logging in.`
    );

    res
      .status(200)
      .json({ message: 'Account created successfully. Check your email for the password.' });
  } catch (error) {
    console.error('Error in verifyOtp:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});
