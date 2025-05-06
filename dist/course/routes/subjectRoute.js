"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subjectRoute = void 0;
const constants_1 = require("../../config/constants");
const jwtAuthenticationMiddleware_1 = require("../../middleware/jwtAuthenticationMiddleware");
const express_1 = __importDefault(require("express"));
const subjectController_1 = require("../controllers/subjectController");
const scheduleRoute_1 = require("./scheduleRoute");
exports.subjectRoute = express_1.default.Router();
exports.subjectRoute.post('/', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), subjectController_1.createSubject);
exports.subjectRoute.put('/', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), subjectController_1.updateSubject);
exports.subjectRoute.delete('/', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), subjectController_1.deleteSubject);
exports.subjectRoute.post('/subject-details', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), subjectController_1.getSubjectInformation);
exports.subjectRoute.post('/filtered-subject-details', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), subjectController_1.fetchSubjectInformationUsingFilters);
exports.subjectRoute.use('/schedule', scheduleRoute_1.scheduleRoute);
