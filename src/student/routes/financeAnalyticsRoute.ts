import express from "express";
import { createFinanceAnalytics, fetchDayWiseAnalytics, fetchMonthWiseAnalytics } from "../controllers/financeAnalyticsController";

export const financeAnalyticsRoute = express.Router()

financeAnalyticsRoute.post('/create', createFinanceAnalytics);
financeAnalyticsRoute.post('/daywise', fetchDayWiseAnalytics);
financeAnalyticsRoute.post('/monthwise', fetchMonthWiseAnalytics);