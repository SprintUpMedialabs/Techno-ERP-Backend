import express from 'express';
import { UserRoles } from '../../config/constants';
import { authenticate, authorize } from '../../middleware/jwtAuthenticationMiddleware';
import { adminAnalytics, createMarketingSourceWiseAnalytics, getDurationBasedUserAnalytics, getMarketingSourceWiseAnalytics, getMarketingUserWiseAnalytics, getUserDailyAnalytics, initializeUserWiseAnalytics, reiterateLeads } from '../controllers/adminController';
import {
  exportData,
  getAllLeadAnalytics,
  getAssignedSheets,
  getFilteredLeadData,
  marketingAnalyticsSQSHandler,
  updateData,
  updateSource,
  uploadData
} from '../controllers/crmController';
import { createMarketingAnalytics, getCallAnalytics, updateMarketingRemark } from '../controllers/marketingAnalyticsController';
import {
  getFilteredYellowLeads,
  getYellowLeadsAnalytics,
  marketingAnalyticsSQSHandlerYellowLead,
  updateYellowLead
} from '../controllers/yellowLeadController';

export const crmRoute = express.Router();

crmRoute.post(
  '/upload',
  authenticate,
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING]),
  uploadData
);

crmRoute.get('/assigned-sheets',
  authenticate,
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING,UserRoles.EMPLOYEE_MARKETING]),
  getAssignedSheets
);

crmRoute.put('/update-source',
  authenticate,
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING]),
  updateSource
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
  '/marketing-analytics-sqs-handler',
  authenticate,
  authorize([UserRoles.LAMBDA_FUNCTION]),
  marketingAnalyticsSQSHandler
);

crmRoute.post(
  '/fetch-data',
  authenticate,
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING, UserRoles.EMPLOYEE_MARKETING,UserRoles.FRONT_DESK]),
  getFilteredLeadData
);

crmRoute.post(
  '/analytics',
  authenticate,
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING, UserRoles.EMPLOYEE_MARKETING,UserRoles.FRONT_DESK]),
  getAllLeadAnalytics
);

crmRoute.post(
  '/yellow-lead',
  authenticate,
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING, UserRoles.EMPLOYEE_MARKETING,UserRoles.FRONT_DESK]),
  getFilteredYellowLeads
);

crmRoute.put(
  '/update-yellow-lead',
  authenticate,
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING, UserRoles.EMPLOYEE_MARKETING]),
  updateYellowLead
);

crmRoute.post(
  '/marketing-analytics-sqs-handler-yellow-lead',
  authenticate,
  authorize([UserRoles.LAMBDA_FUNCTION]),
  marketingAnalyticsSQSHandlerYellowLead
);

//This is no longer the request endpoint, it is used as internal function
// crmRoute.post('/yellow-lead', createYellowLead);

crmRoute.post(
  '/yellow-lead-analytics',
  authenticate,
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING, UserRoles.EMPLOYEE_MARKETING,UserRoles.FRONT_DESK]),
  getYellowLeadsAnalytics
);

crmRoute.post('/admin/analytics', 
  authenticate, 
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING]), 
  adminAnalytics
);


crmRoute.get('/marketing-analytics', 
  authenticate, 
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING]), 
  createMarketingAnalytics
);

crmRoute.get('/call-analytics', 
  authenticate, 
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING]), 
  getCallAnalytics
);

crmRoute.put('/update-marketing-remark', 
  authenticate, 
  authorize([UserRoles.LEAD_MARKETING, UserRoles.EMPLOYEE_MARKETING]), 
  updateMarketingRemark
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

crmRoute.get('/user-daily-analytics', 
  authenticate, 
  authorize([UserRoles.EMPLOYEE_MARKETING, UserRoles.LEAD_MARKETING, UserRoles.ADMIN]), 
  getUserDailyAnalytics
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