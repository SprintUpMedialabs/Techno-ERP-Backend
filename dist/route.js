"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = __importDefault(require("express"));
const routes_1 = require("./admission/routes");
const authRoute_1 = require("./auth/routes/authRoute");
const userRoute_1 = require("./auth/routes/userRoute");
const courseMetadataRoute_1 = __importDefault(require("./course/routes/courseMetadataRoute"));
const courseRoute_1 = require("./course/routes/courseRoute");
const departmentMetaDataRoute_1 = require("./course/routes/departmentMetaDataRoute");
const testRoute_1 = require("./course/routes/testRoute");
const crmRoute_1 = require("./crm/routes/crmRoute");
const courseAndOtherFees_routes_1 = __importDefault(require("./fees/courseAndOtherFees.routes"));
const routes_2 = require("./student/routes");
const dropDownRoute_1 = require("./utilityModules/dropdown/dropDownRoute");
const route_1 = require("./common/route");
const backupController_1 = require("./backup/backupController");
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
/**
 * Contains the router for Admission Module
 */
exports.apiRouter.use('/admission', routes_1.admissionRoute);
/**
 * Contains the router for Fees Module
 */
exports.apiRouter.use('/fees-structure', courseAndOtherFees_routes_1.default);
/**
 * Contains the router for Course Module
 */
exports.apiRouter.use('/course', courseRoute_1.courseRoute);
/**
 * Contains the router for Department Module
 */
exports.apiRouter.use('/department-metadata', departmentMetaDataRoute_1.departmentMetaDataRoute);
/**
 * Contains the router for Course Metadata Module
 */
exports.apiRouter.use('/course-metadata', courseMetadataRoute_1.default);
/**
 * Contains the router for Dropdown related information
 */
exports.apiRouter.use('/dropdown', dropDownRoute_1.dropDownRoute);
/**
 * Contains the router for Testing Purpose
 */
exports.apiRouter.use('/test', testRoute_1.testRoute);
/**
 * Contains the router for Student Module
 */
exports.apiRouter.use('/student', routes_2.studentRoute);
exports.apiRouter.use('/download-reciept', route_1.downloadRoute);
exports.apiRouter.use('/backup', backupController_1.backupRoute);
