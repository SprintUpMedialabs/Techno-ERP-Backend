"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.financeAnalyticsRoute = void 0;
const express_1 = __importDefault(require("express"));
const financeAnalyticsController_1 = require("../controllers/financeAnalyticsController");
exports.financeAnalyticsRoute = express_1.default.Router();
exports.financeAnalyticsRoute.post('/create', financeAnalyticsController_1.createFinanceAnalytics);
exports.financeAnalyticsRoute.post('/daywise', financeAnalyticsController_1.fetchDayWiseAnalytics);
exports.financeAnalyticsRoute.post('/monthwise', financeAnalyticsController_1.fetchMonthWiseAnalytics);
