"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.semesterRoute = void 0;
const express_1 = __importDefault(require("express"));
const constants_1 = require("../../config/constants");
const jwtAuthenticationMiddleware_1 = require("../../middleware/jwtAuthenticationMiddleware");
const semesterController_1 = require("../controllers/semesterController");
const subjectRoute_1 = require("./subjectRoute");
exports.semesterRoute = express_1.default.Router();
exports.semesterRoute.post('/', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), semesterController_1.createSemester);
// DACHECK : As per our last discussion, we have decided to just keep the deleteSemester option and not create or update, but I want to add one semester in some course, how will it happen in that case?
exports.semesterRoute.delete('/', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), semesterController_1.deleteSemester);
exports.semesterRoute.use('/subject', subjectRoute_1.subjectRoute);
