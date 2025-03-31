"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = __importDefault(require("express"));
const jwtAuthenticationMiddleware_1 = require("../../middleware/jwtAuthenticationMiddleware");
const userController_1 = require("../controllers/userController");
const constants_1 = require("../../config/constants");
exports.userRouter = express_1.default.Router();
exports.userRouter.get('/profile', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), userController_1.userProfile);
exports.userRouter.get('/get-user', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), userController_1.getUserByRole);
exports.userRouter.get('/fetch-dropdown', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.ADMIN, constants_1.UserRoles.LEAD_MARKETING, constants_1.UserRoles.EMPLOYEE_MARKETING]), userController_1.fetchDropdownsBasedOnPage);
