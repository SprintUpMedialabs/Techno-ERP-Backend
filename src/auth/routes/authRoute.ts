import express from 'express';
import {
  forgotPassword,
  isAuthenticated,
  login,
  logout,
  register,
  sendOtpToEmail,
  updatePassword,
  validateAndVerifyOtp
} from '../controllers/authController';
import { authenticate } from '../../middleware/jwtAuthenticationMiddleware';

export const authRouter = express.Router();

/**
 * Input : email
 */
authRouter.post('/send-otp', sendOtpToEmail);

/**
 * Input : email, otp
 */
authRouter.post('/verify-otp', validateAndVerifyOtp);

/**
 * Input : token, firstName, lastName, roles
 */
authRouter.post('/register', register);

/**
 * Input : email, password
 */
authRouter.post('/login', login);

/*
 * Logout
 **/
authRouter.get('/logout', authenticate, logout);

/*
 * Input : Email
 **/
authRouter.post('/forgot-password', forgotPassword);

/***
 * Update Password : Use token, input : new password
 */
authRouter.post('/update-password', updatePassword);


authRouter.get('/is-authenticated', isAuthenticated);