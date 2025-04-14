"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentRoute = void 0;
const express_1 = __importDefault(require("express"));
const jwtAuthenticationMiddleware_1 = require("../../middleware/jwtAuthenticationMiddleware");
const constants_1 = require("../../config/constants");
const courseRoute_1 = require("./courseRoute");
const departmentController_1 = require("../controllers/departmentController");
exports.departmentRoute = express_1.default.Router();
exports.departmentRoute.post('/', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), departmentController_1.createDepartment);
exports.departmentRoute.put('/', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), departmentController_1.updateDepartment);
exports.departmentRoute.use('/course', courseRoute_1.courseRoute);
