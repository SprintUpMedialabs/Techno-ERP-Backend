"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.financeAnalyticsRoute = void 0;
const express_1 = __importDefault(require("express"));
const constants_1 = require("../../config/constants");
const jwtAuthenticationMiddleware_1 = require("../../middleware/jwtAuthenticationMiddleware");
const financeAnalyticsController_1 = require("../controllers/financeAnalyticsController");
exports.financeAnalyticsRoute = express_1.default.Router();
exports.financeAnalyticsRoute.post('/create', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.SYSTEM_ADMIN]), financeAnalyticsController_1.createFinanceAnalytics);
exports.financeAnalyticsRoute.post('/daywise', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.ADMIN, constants_1.UserRoles.SYSTEM_ADMIN]), financeAnalyticsController_1.fetchDayWiseAnalytics);
exports.financeAnalyticsRoute.post('/monthwise', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.ADMIN]), financeAnalyticsController_1.fetchMonthWiseAnalytics);
