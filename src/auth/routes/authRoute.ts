import express from 'express';
import { register, verifyOtp } from '../controllers/authController';

export const authRouter = express.Router();

/**
 * Input : id, email, firstName, lastName, roles
*/
authRouter.post('/register', register);
/**
 * Input : email, otp
*/
authRouter.get('/verify-otp', verifyOtp);
