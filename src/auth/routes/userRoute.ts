import express from 'express';
import {
  authenticate,
  authorize
} from '../../middleware/jwtAuthenticationMiddleware';
import { userProfile } from '../controllers/userController';
import { UserRoles } from '../../config/constants';

export const userRouter = express.Router();

userRouter.get('/profile', authenticate, authorize([UserRoles.BASIC_USER]), userProfile);
