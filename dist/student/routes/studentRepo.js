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
const multerConfig_1 = __importDefault(require("../../config/multerConfig"));
const studentDataSheetController_1 = require("../controllers/studentDataSheetController");
exports.studentRepoRoute = express_1.default.Router();
exports.studentRepoRoute.get('/export-data', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER, constants_1.UserRoles.FRONT_DESK, constants_1.UserRoles.REGISTAR, constants_1.UserRoles.FINANCE]), studentDataSheetController_1.exportStudentData);
exports.studentRepoRoute.post('/search', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER, constants_1.UserRoles.FRONT_DESK, constants_1.UserRoles.REGISTAR, constants_1.UserRoles.FINANCE]), studentController_1.getStudentDataBySearch);
exports.studentRepoRoute.get("/:id", jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER, constants_1.UserRoles.FRONT_DESK, constants_1.UserRoles.REGISTAR, constants_1.UserRoles.FINANCE]), studentController_1.getStudentDataById);
exports.studentRepoRoute.put('/student-details', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER, constants_1.UserRoles.REGISTAR, constants_1.UserRoles.FINANCE]), studentController_1.updateStudentDataById);
exports.studentRepoRoute.put('/student-physical-document', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER, constants_1.UserRoles.REGISTAR, constants_1.UserRoles.FINANCE]), studentController_1.updateStudentPhysicalDocumentById);
exports.studentRepoRoute.put('/document', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER, constants_1.UserRoles.FRONT_DESK, constants_1.UserRoles.REGISTAR, constants_1.UserRoles.FINANCE]), multerConfig_1.default.single('document'), studentController_1.updateStudentDocumentsById);
