import express from 'express';
import { updateData, uploadData } from '../controllers/crmController';
import { authenticate, authorize } from '../../middleware/jwtAuthenticationMiddleware';
import { UserRoles } from '../../config/constants';

export const crmRoute = express.Router();

crmRoute.post('/upload',authenticate, authorize([UserRoles.ADMIN, UserRoles.MARKETING_LEAD]), uploadData);

crmRoute.put('/edit', authenticate, authorize([UserRoles.ADMIN, UserRoles.EMPLOYEE_MARKETING, UserRoles.MARKETING_LEAD]), updateData);