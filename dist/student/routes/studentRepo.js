"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentRepoRoute = void 0;
const express_1 = __importDefault(require("express"));
const jwtAuthenticationMiddleware_1 = require("../../middleware/jwtAuthenticationMiddleware");
const constants_1 = require("../../config/constants");
const studentController_1 = require("../controllers/studentController");
exports.studentRepoRoute = express_1.default.Router();
exports.studentRepoRoute.post('/search', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), studentController_1.getStudentDataBySearch);
exports.studentRepoRoute.get("/:id", jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), studentController_1.getStudentDataById);
exports.studentRepoRoute.put('/student-details', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), studentController_1.updateStudentDataById);
exports.studentRepoRoute.put('/student-physical-document', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), studentController_1.updateStudentPhysicalDocumentById);
