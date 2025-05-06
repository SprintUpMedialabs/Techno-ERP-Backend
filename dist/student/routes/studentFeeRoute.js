"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentFeeRoute = void 0;
const express_1 = __importDefault(require("express"));
const jwtAuthenticationMiddleware_1 = require("../../middleware/jwtAuthenticationMiddleware");
const constants_1 = require("../../config/constants");
const studentDuesController_1 = require("../controllers/studentDuesController");
exports.studentFeeRoute = express_1.default.Router();
exports.studentFeeRoute.post("/active-dues", jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), studentDuesController_1.getStudentDues);
exports.studentFeeRoute.get("/fee-information/:id", jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), studentDuesController_1.fetchFeeInformationByStudentId);
exports.studentFeeRoute.post("/record-payment", jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), studentDuesController_1.recordPayment);
exports.studentFeeRoute.post("/fee-update-history", jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), studentDuesController_1.fetchFeeUpdatesHistory);
exports.studentFeeRoute.put("/fee-breakup", jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), studentDuesController_1.editFeeBreakUp);
