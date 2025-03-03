import express from 'express';
import { forgotPassword, login, logout, register, updatePassword, verifyOtp } from '../controllers/authController';


export const authRouter = express.Router();


/**
 * Input : id, email, firstName, lastName, roles
*/
authRouter.post('/register', register);


/**
 * Input : email, otp
*/
authRouter.post('/verify-otp', verifyOtp);


/**
 * Input : email, password
*/
authRouter.post('/login', login)


/*
* Logout
**/
authRouter.get('/logout', logout)


/*
* Input : Email
**/
authRouter.post('/forgot-password', forgotPassword)


/***
 * Update Password : Use token, input : new password
*/
authRouter.post('/update-password', updatePassword)


