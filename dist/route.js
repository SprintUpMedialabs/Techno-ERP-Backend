"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = __importDefault(require("express"));
const authRoute_1 = require("./auth/routes/authRoute");
const userRoute_1 = require("./auth/routes/userRoute");
const crmRoute_1 = require("./crm/routes/crmRoute");
const routes_1 = require("./admission/routes");
const courseAndOtherFees_routes_1 = __importDefault(require("./fees/courseAndOtherFees.routes"));
const studentRoute_1 = require("./student-data/routes/studentRoute");
exports.apiRouter = express_1.default.Router();
/**
 * Contains the router for Authentication
 */
exports.apiRouter.use('/auth', authRoute_1.authRouter);
/**
 * Contains the router for User
 */
exports.apiRouter.use('/user', userRoute_1.userRouter);
/**
 * Contains the router for CRM Module
 */
exports.apiRouter.use('/crm', crmRoute_1.crmRoute);
exports.apiRouter.use('/admission', routes_1.admissionRoute);
exports.apiRouter.use('/fees-structure', courseAndOtherFees_routes_1.default);
exports.apiRouter.use('/student-data', studentRoute_1.studentDataRoute);
