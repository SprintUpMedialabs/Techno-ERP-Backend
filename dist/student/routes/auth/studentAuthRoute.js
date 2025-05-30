"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentAuthRoute = void 0;
const express_1 = __importDefault(require("express"));
const studentAuthenticationController_1 = require("../../controllers/studentAuthenticationController");
const jwtStudentAuthenticationMiddleware_1 = require("../../../middleware/jwtStudentAuthenticationMiddleware");
exports.studentAuthRoute = express_1.default.Router();
exports.studentAuthRoute.post('/login', studentAuthenticationController_1.studentLogin);
exports.studentAuthRoute.get('/logout', jwtStudentAuthenticationMiddleware_1.authenticate, studentAuthenticationController_1.studentLogout);
