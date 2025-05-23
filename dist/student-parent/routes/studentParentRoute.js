"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentParentRoute = void 0;
const express_1 = __importDefault(require("express"));
const studentParentController_1 = require("../controllers/studentParentController");
const constants_1 = require("../../config/constants");
const jwtStudentAuthenticationMiddleware_1 = require("../../middleware/jwtStudentAuthenticationMiddleware");
exports.studentParentRoute = express_1.default.Router();
exports.studentParentRoute.get('/get-info', jwtStudentAuthenticationMiddleware_1.authenticate, (0, jwtStudentAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.STUDENT]), studentParentController_1.getStudentInformation);
exports.studentParentRoute.post('/schedule-info', jwtStudentAuthenticationMiddleware_1.authenticate, (0, jwtStudentAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.STUDENT]), studentParentController_1.getScheduleInformation);
