import express from 'express';
import {
  AuthenticatedRequest,
  jwtAuthenticationMiddleWare
} from '../../middleware/jwtAuthenticationMiddleware';
import { Response } from 'express';
import { userProfile } from '../controllers/userController';

export const userRouter = express.Router();

userRouter.get('/profile', jwtAuthenticationMiddleWare, userProfile);
