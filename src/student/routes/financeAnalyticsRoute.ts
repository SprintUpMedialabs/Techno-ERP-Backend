import express from "express";
import { UserRoles } from "../../config/constants";
import { authenticate, authorize } from "../../middleware/jwtAuthenticationMiddleware";
import { createFinanceAnalytics, fetchDayWiseAnalytics, fetchMonthWiseAnalytics } from "../controllers/financeAnalyticsController";

export const financeAnalyticsRoute = express.Router()

financeAnalyticsRoute.post('/create',
    authenticate,
    authorize([UserRoles.SYSTEM_ADMIN]),
    createFinanceAnalytics
);

financeAnalyticsRoute.post('/daywise',
    authenticate,
    authorize([UserRoles.ADMIN, UserRoles.SYSTEM_ADMIN]),
    fetchDayWiseAnalytics
);

financeAnalyticsRoute.post('/monthwise',
    authenticate,
    authorize([UserRoles.ADMIN]),
    fetchMonthWiseAnalytics
);