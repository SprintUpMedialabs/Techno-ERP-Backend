"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.admissionRoute = void 0;
const express_1 = __importDefault(require("express"));
const enquiryFormRoute_1 = require("./enquiryFormRoute");
const admissionController_1 = require("../controllers/admissionController");
const constants_1 = require("../../config/constants");
const jwtAuthenticationMiddleware_1 = require("../../middleware/jwtAuthenticationMiddleware");
exports.admissionRoute = express_1.default.Router();
exports.admissionRoute.use('/enquiry', enquiryFormRoute_1.enquiryRoute);
exports.admissionRoute.get('/admission-analytics', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), admissionController_1.getAdmissionStats);
