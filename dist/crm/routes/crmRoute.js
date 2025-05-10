"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.crmRoute = void 0;
const express_1 = __importDefault(require("express"));
const constants_1 = require("../../config/constants");
const jwtAuthenticationMiddleware_1 = require("../../middleware/jwtAuthenticationMiddleware");
const crmController_1 = require("../controllers/crmController");
const yellowLeadController_1 = require("../controllers/yellowLeadController");
const adminController_1 = require("../controllers/adminController");
const marketingAnalyticsController_1 = require("../controllers/marketingAnalyticsController");
exports.crmRoute = express_1.default.Router();
exports.crmRoute.post('/upload', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.ADMIN, constants_1.UserRoles.LEAD_MARKETING]), crmController_1.uploadData);
exports.crmRoute.get('/export-data', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.ADMIN, constants_1.UserRoles.LEAD_MARKETING, constants_1.UserRoles.EMPLOYEE_MARKETING]), crmController_1.exportData);
exports.crmRoute.put('/edit', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.ADMIN, constants_1.UserRoles.LEAD_MARKETING, constants_1.UserRoles.EMPLOYEE_MARKETING]), crmController_1.updateData);
exports.crmRoute.post('/fetch-data', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.ADMIN, constants_1.UserRoles.LEAD_MARKETING, constants_1.UserRoles.EMPLOYEE_MARKETING]), crmController_1.getFilteredLeadData);
exports.crmRoute.post('/analytics', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.ADMIN, constants_1.UserRoles.LEAD_MARKETING, constants_1.UserRoles.EMPLOYEE_MARKETING]), crmController_1.getAllLeadAnalytics);
exports.crmRoute.post('/yellow-lead', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.ADMIN, constants_1.UserRoles.LEAD_MARKETING, constants_1.UserRoles.EMPLOYEE_MARKETING]), yellowLeadController_1.getFilteredYellowLeads);
exports.crmRoute.put('/update-yellow-lead', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.ADMIN, constants_1.UserRoles.LEAD_MARKETING, constants_1.UserRoles.EMPLOYEE_MARKETING]), yellowLeadController_1.updateYellowLead);
//This is no longer the request endpoint, it is used as internal function
// crmRoute.post('/yellow-lead', createYellowLead);
exports.crmRoute.post('/yellow-lead-analytics', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.ADMIN, constants_1.UserRoles.LEAD_MARKETING, constants_1.UserRoles.EMPLOYEE_MARKETING]), yellowLeadController_1.getYellowLeadsAnalytics);
exports.crmRoute.post('/admin/analytics', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.ADMIN]), adminController_1.adminAnalytics);
exports.crmRoute.get('/marketing-analytics', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.ADMIN]), marketingAnalyticsController_1.createMarketingAnalytics);
exports.crmRoute.get('/call-analytics', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.ADMIN]), marketingAnalyticsController_1.getCallAnalytics);
