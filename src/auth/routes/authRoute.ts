import express from 'express';
import { register, verifyOtp } from '../controllers/authController';

export const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.get('/verify-otp', verifyOtp);
