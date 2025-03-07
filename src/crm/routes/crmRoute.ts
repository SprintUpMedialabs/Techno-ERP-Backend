import express from 'express';
import { uploadData } from '../controllers/crmController';
import { authenticate, authorize } from '../../middleware/jwtAuthenticationMiddleware';
import { UserRoles } from '../../config/constants';

export const crmRoute = express.Router();

crmRoute.get('/upload',authenticate, authorize([UserRoles.ADMIN, UserRoles.MARKETING_LEAD, UserRoles.EMPLOYEE_MARKETING]), uploadData)