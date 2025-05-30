"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const constants_1 = require("../../config/constants");
const jwtAuthenticationMiddleware_1 = require("../../middleware/jwtAuthenticationMiddleware");
const courseMetadataController_1 = require("../controllers/courseMetadataController");
const courseMetaDataRoute = express_1.default.Router();
courseMetaDataRoute.post('/course', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), courseMetadataController_1.createCourse);
courseMetaDataRoute.get('/course-code', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), courseMetadataController_1.getCourseCodes);
courseMetaDataRoute.get('/:courseCode', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), courseMetadataController_1.getCourseMetadataByCourseCode);
courseMetaDataRoute.get('/:courseCode/admission-documents', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), courseMetadataController_1.getAdmissoinDocumentListByCourseCode);
courseMetaDataRoute.get('/:courseCode/fee-infromation', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), courseMetadataController_1.getCourseFeeByCourseCodee);
exports.default = courseMetaDataRoute;
