import { CookieOptions, Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { userSchema } from '../validators/user';
import { RegisterUser } from '../types/user.type';
import { sendEmail } from '../../config/mailer';
import bcrypt from 'bcrypt';
import PrismaRepo from '../../config/prismaRepo';
import * as jwt from 'jsonwebtoken';
import { AUTH_API_PATH, JWT_SECRET } from '../../secrets';
import { generateOTP } from '../utils/otpGenerator';


const prisma = PrismaRepo.getClient;


export const register = expressAsyncHandler(async (req: Request, res: Response) => {
  try {
    const user: RegisterUser = req.body;

    const validation = userSchema.safeParse(user);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors });
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: user.email }
    });

    if (existingUser) {
      res.status(400).json({ eror: 'User already exists with email id' });
      return;
    }

    let otp = generateOTP(10, 6);

    const newUser = await prisma.user.create({
      data: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        password: '',
        verifyOtp: parseInt(otp.otpValue),
        verifyOtpExpireAt: otp.otpExpiryTime
      }
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

    const user = await prisma.user.findFirst({
      where: { email: email }
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
    console.error('Error in verifyOtp:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});




export const login = expressAsyncHandler(async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      res.status(404).json({ message: 'Please enter email address' });
      return;
    }
    if (!password) {
      res.status(404).json({ message: 'Please enter password' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { email: email }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found. Please register first.' });
      return;
    }

    let isPasswordValid = bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(404).json({ message: 'Passwords did not match, Please enter a valid password.' });
      return;
    }

    let payload = {
      id: user.id,
      roles: user.roles
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: '15d'
    });

    let options: CookieOptions = {
      maxAge: 15 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    };

    try {
      res.cookie('token', token, options);
    } catch (error) {
      res.status(404).json({ message: 'Could not set token successfully' });
      return;
    }

    res.status(200).json({
      message: 'Generated token and cookie set successfully',
      token: token,
      roles: user.roles,
      userData: {
        name: user.firstName + ' ' + user.lastName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error in login handler', error);
    res.status(404).json({ error: 'Error encountered in logging in, Please try again' });
  }
});



export const logout = (req: Request, res: Response) => {
  res.cookie('token', '', {
    maxAge: 0,
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });
  res.json({ message: 'Logged out successfully' });
};

export const forgotPassword = expressAsyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await prisma.user.findFirst({
    where: { email: email }
  });

  if (!user) {
    res
      .status(404)
      .send({ message: 'Please create your account first, no account exists with this email!' });
    return;
  }

  const token = jwt.sign({ userId: user.id, expiry: Date.now() + 15 * 60 * 1000 }, JWT_SECRET, {
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
  res.status(200).send({ message: 'Reset Password email sent successfully' });
  return;
});



export const updatePassword = expressAsyncHandler(async (req: Request, res: Response) => {
  const token = req.query.token as string;
  const { password } = req.body;

  if (!token) {
    res.status(404).send({ message: 'Invalid reset link' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; expiry: number };

    if (Date.now() > decoded.expiry) {
      res.status(404).send({ message: 'Reset link expired!' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      res.status(404).send({ message: "Your account doesn't exist" });
      return;
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log(hashedPassword);
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { password: hashedPassword }
      });
    }

    res.status(200).send({ message: 'Password Updated' });
    return;
  } catch (error) {
    console.log(error);
    res.status(404).send({ message: 'Invalid or tampered reset link' });
    return;
  }
});
