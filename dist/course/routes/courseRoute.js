"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseRoute = void 0;
const express_1 = __importDefault(require("express"));
const jwtAuthenticationMiddleware_1 = require("../../middleware/jwtAuthenticationMiddleware");
const constants_1 = require("../../config/constants");
const semesterRoute_1 = require("./semesterRoute");
const courseController_1 = require("../controllers/courseController");
exports.courseRoute = express_1.default.Router();
exports.courseRoute.post('/', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), courseController_1.createCourse);
exports.courseRoute.put('/', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), courseController_1.updateCourse);
exports.courseRoute.delete('/', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), courseController_1.deleteCourse);
exports.courseRoute.post('/search', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), courseController_1.searchCourse);
exports.courseRoute.use('/semester', semesterRoute_1.semesterRoute);
