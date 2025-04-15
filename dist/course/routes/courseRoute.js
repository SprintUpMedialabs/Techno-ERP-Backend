"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseRoute = void 0;
const constants_1 = require("../../config/constants");
const jwtAuthenticationMiddleware_1 = require("../../middleware/jwtAuthenticationMiddleware");
const express_1 = __importDefault(require("express"));
const courseController_1 = require("../controllers/courseController");
const subjectRoute_1 = require("./subjectRoute");
exports.courseRoute = express_1.default.Router();
exports.courseRoute.post('/', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), courseController_1.createCourse);
exports.courseRoute.use('/subject', subjectRoute_1.subjectRoute);
