"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.admissionRoute = void 0;
const express_1 = __importDefault(require("express"));
const enquiryFormRoute_1 = require("./enquiryFormRoute");
const admissionAnalyticsController_1 = require("../controllers/admissionAnalyticsController");
const constants_1 = require("../../config/constants");
const jwtAuthenticationMiddleware_1 = require("../../middleware/jwtAuthenticationMiddleware");
const excelSheetController_1 = require("../controllers/excelSheetController");
exports.admissionRoute = express_1.default.Router();
exports.admissionRoute.use('/enquiry', enquiryFormRoute_1.enquiryRoute);
exports.admissionRoute.get('/analytics', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.ADMIN]), admissionAnalyticsController_1.getAdmissionStats);
exports.admissionRoute.get('/assign-base-value', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.SYSTEM_ADMIN]), admissionAnalyticsController_1.assignBaseValueToAdmissionAnalytics);
exports.admissionRoute.get('/enquiry-excel-sheet-data', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), excelSheetController_1.getRecentEnquiryExcelSheetData);
exports.admissionRoute.get('/admission-excel-sheet-data', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), excelSheetController_1.getRecentAdmissionExcelSheetData);
