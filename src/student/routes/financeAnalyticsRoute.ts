import express from "express";
import { UserRoles } from "../../config/constants";
import { authenticate, authorize } from "../../middleware/jwtAuthenticationMiddleware";
import { createFinanceAnalytics, fetchDayWiseAnalytics, fetchMonthWiseAnalytics, fetchOverallAnalytics } from "../controllers/financeAnalyticsController";

export const financeAnalyticsRoute = express.Router()

financeAnalyticsRoute.post('/create',
    authenticate,
    authorize([UserRoles.SYSTEM_ADMIN]),
    createFinanceAnalytics
);

financeAnalyticsRoute.post('/daywise',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    fetchDayWiseAnalytics
);

financeAnalyticsRoute.post('/monthwise',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    fetchMonthWiseAnalytics
);

financeAnalyticsRoute.post('/overall',
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    fetchOverallAnalytics
);