"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentDataRoute = void 0;
const express_1 = __importDefault(require("express"));
const constants_1 = require("../../config/constants");
const multerConfig_1 = __importDefault(require("../../config/multerConfig"));
const jwtAuthenticationMiddleware_1 = require("../../middleware/jwtAuthenticationMiddleware");
const studentController_1 = require("../controllers/studentController");
exports.studentDataRoute = express_1.default.Router();
exports.studentDataRoute.post('/search', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), studentController_1.getStudentData);
exports.studentDataRoute.get('/:id', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), studentController_1.getStudentDataById);
exports.studentDataRoute.put('/:id', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), studentController_1.updateStudentById);
exports.studentDataRoute.put('/update-document', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), multerConfig_1.default.single('document'), studentController_1.updateStudentDocuments);
