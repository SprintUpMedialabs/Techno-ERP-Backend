import express from 'express';
import { enquiryRoute } from './enquiryFormRoute';
import { assignBaseValueToAdmissionAnalytics, getAdmissionStats } from '../controllers/admissionAnalyticsController';
import { UserRoles } from '../../config/constants';
import { authenticate, authorize } from '../../middleware/jwtAuthenticationMiddleware';
import { getRecentEnquiryExcelSheetData } from '../controllers/excelSheetData';
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

admissionRoute.get('/recent-enquiry-excel-sheet-data',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    getRecentEnquiryExcelSheetData
);

admissionRoute.get('/recent-admission-excel-sheet-data',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    getRecentAdmissionExcelSheetData
);