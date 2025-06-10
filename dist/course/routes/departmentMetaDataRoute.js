"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentMetaDataRoute = void 0;
const constants_1 = require("../../config/constants");
const jwtAuthenticationMiddleware_1 = require("../../middleware/jwtAuthenticationMiddleware");
const express_1 = __importDefault(require("express"));
const departmentMetaDataController_1 = require("../controllers/departmentMetaDataController");
exports.departmentMetaDataRoute = express_1.default.Router();
exports.departmentMetaDataRoute.post('/', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), departmentMetaDataController_1.createDepartmentMetaData);
exports.departmentMetaDataRoute.put('/', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), departmentMetaDataController_1.updateDepartmentMetaData);
exports.departmentMetaDataRoute.get('/', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), departmentMetaDataController_1.getDepartmentMetaData);
exports.departmentMetaDataRoute.post('/instructors', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), departmentMetaDataController_1.fetchInstructors);
