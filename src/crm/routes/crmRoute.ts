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
  createYellowLead,
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
  authorize([UserRoles.ADMIN, UserRoles.EMPLOYEE_MARKETING, UserRoles.LEAD_MARKETING]),
  updateData
);

crmRoute.post(
  '/fetch-data',
  authenticate,
  authorize([UserRoles.EMPLOYEE_MARKETING, UserRoles.ADMIN, UserRoles.LEAD_MARKETING]),
  getFilteredLeadData
);

crmRoute.post(
  '/analytics',
  authenticate,
  authorize([UserRoles.ADMIN, UserRoles.EMPLOYEE_MARKETING, UserRoles.LEAD_MARKETING]),
  getAllLeadAnalytics
);

crmRoute.get('/yellow-lead', getFilteredYellowLeads);

crmRoute.put('/yellow-lead', updateYellowLead);

crmRoute.post('/yellow-lead', createYellowLead);

crmRoute.get('/yellow-lead/analytics', getYellowLeadsAnalytics);
