import express from 'express';
import { enquiryRoute } from './enquiryFormRoute';
import { getAdmissionStats } from '../controllers/admissionAnalyticsController';
import { UserRoles } from '../../config/constants';
import { authenticate, authorize } from '../../middleware/jwtAuthenticationMiddleware';
export const admissionRoute = express.Router();

admissionRoute.use('/enquiry', enquiryRoute);

admissionRoute.get('/analytics',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    getAdmissionStats
);
