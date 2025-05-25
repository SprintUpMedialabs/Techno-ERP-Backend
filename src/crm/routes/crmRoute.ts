import express from 'express';
import { UserRoles } from '../../config/constants';
import { authenticate, authorize } from '../../middleware/jwtAuthenticationMiddleware';
import {
  exportData,
  getAllLeadAnalytics,
  getFilteredLeadData,
  updateData,
  uploadData
} from '../controllers/crmController';
import {
  getFilteredYellowLeads,
  getYellowLeadsAnalytics,
  updateYellowLead
} from '../controllers/yellowLeadController';
import { adminAnalytics, createMarketingSourceWiseAnalytics, getDurationBasedUserAnalytics, getMarketingSourceWiseAnalytics, getMarketingUserWiseAnalytics, initializeUserWiseAnalytics, reiterateLeads } from '../controllers/adminController';
import { createMarketingAnalytics, getCallAnalytics } from '../controllers/marketingAnalyticsController';
import { User } from '../../auth/models/user';

export const crmRoute = express.Router();

crmRoute.post(
  '/upload',
  authenticate,
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING]),
  uploadData
);

crmRoute.get(
  '/export-data',
  authenticate,
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING, UserRoles.EMPLOYEE_MARKETING]),
  exportData
);

crmRoute.put(
  '/edit',
  authenticate,
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING, UserRoles.EMPLOYEE_MARKETING]),
  updateData
);

crmRoute.post(
  '/fetch-data',
  authenticate,
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING, UserRoles.EMPLOYEE_MARKETING]),
  getFilteredLeadData
);

crmRoute.post(
  '/analytics',
  authenticate,
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING, UserRoles.EMPLOYEE_MARKETING]),
  getAllLeadAnalytics
);

crmRoute.post(
  '/yellow-lead',
  authenticate,
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING, UserRoles.EMPLOYEE_MARKETING]),
  getFilteredYellowLeads
);

crmRoute.put(
  '/update-yellow-lead',
  authenticate,
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING, UserRoles.EMPLOYEE_MARKETING]),
  updateYellowLead
);

//This is no longer the request endpoint, it is used as internal function
// crmRoute.post('/yellow-lead', createYellowLead);

crmRoute.post(
  '/yellow-lead-analytics',
  authenticate,
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING, UserRoles.EMPLOYEE_MARKETING]),
  getYellowLeadsAnalytics
);

crmRoute.post('/admin/analytics', 
  authenticate, 
  authorize([UserRoles.ADMIN]), 
  adminAnalytics
);


crmRoute.get('/marketing-analytics', 
  authenticate, 
  authorize([UserRoles.ADMIN]), 
  createMarketingAnalytics
);

crmRoute.get('/call-analytics', 
  authenticate, 
  authorize([UserRoles.ADMIN]), 
  getCallAnalytics
);

crmRoute.post('/source-analytics', 
  authenticate, 
  authorize([UserRoles.ADMIN, UserRoles.SYSTEM_ADMIN]), 
  createMarketingSourceWiseAnalytics
);

crmRoute.get('/source-analytics', 
  authenticate, 
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING]), 
  getMarketingSourceWiseAnalytics
);

crmRoute.get('/user-wise-analytics-daily', 
  authenticate, 
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING]), 
  getMarketingUserWiseAnalytics
);

crmRoute.post('/user-wise-analytics-duration', 
  authenticate, 
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING]), 
  getDurationBasedUserAnalytics
);

crmRoute.post('/user-wise-analytics', 
  authenticate, 
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING, UserRoles.SYSTEM_ADMIN]), 
  initializeUserWiseAnalytics
);


crmRoute.post('/iterate-leads', 
  authenticate, 
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING, UserRoles.SYSTEM_ADMIN]), 
  reiterateLeads
);

