import { UserRoles } from "../../config/constants";

import { authenticate, authorize } from "../../middleware/jwtAuthenticationMiddleware";
import { getAllLeadAnalyticsV1 } from "../controllers/crmController";

import { Router } from "express";
import { getYellowLeadsAnalyticsV1 } from "../controllers/yellowLeadController";
import { adminAnalyticsV1 } from "../controllers/adminController";


export const crmV1Routes = Router();

crmV1Routes.post(
    '/analytics',
    authenticate,
    authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING, UserRoles.EMPLOYEE_MARKETING]),
    getAllLeadAnalyticsV1
);

crmV1Routes.post(
    '/yellow-lead-analytics',
    authenticate,
    authorize([UserRoles.ADMIN, UserRoles.LEAD_MARKETING, UserRoles.EMPLOYEE_MARKETING]),
    getYellowLeadsAnalyticsV1
);

crmV1Routes.post(
    '/admin/analytics',
    authenticate,
    authorize([UserRoles.ADMIN]),
    adminAnalyticsV1
);