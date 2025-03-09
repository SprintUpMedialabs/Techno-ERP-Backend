import express from 'express';
import { UserRoles } from '../../config/constants';
import { authenticate, authorize } from '../../middleware/jwtAuthenticationMiddleware';
import {
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

export const crmRoute = express.Router();

crmRoute.post(
  '/upload',
  authenticate,
  authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING]),
  uploadData
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
