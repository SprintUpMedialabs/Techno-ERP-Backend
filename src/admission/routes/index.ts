import express from 'express';
import { enquiryRoute } from './enquiryFormRoute';
import { assignBaseValueToAdmissionAnalytics, getAdmissionStats } from '../controllers/admissionAnalyticsController';
import { UserRoles } from '../../config/constants';
import { authenticate, authorize } from '../../middleware/jwtAuthenticationMiddleware';
export const admissionRoute = express.Router();

admissionRoute.use('/enquiry', enquiryRoute);

admissionRoute.get('/analytics',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    getAdmissionStats
);

admissionRoute.get('/assign-base-value',
    authenticate,
    authorize([UserRoles.SYSTEM_ADMIN]),
    assignBaseValueToAdmissionAnalytics
);