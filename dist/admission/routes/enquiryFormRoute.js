"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enquiryFromRoute = void 0;
const express_1 = __importDefault(require("express"));
const jwtAuthenticationMiddleware_1 = require("../../middleware/jwtAuthenticationMiddleware");
const constants_1 = require("../../config/constants");
const enquiryFormController_1 = require("../controllers/enquiryFormController");
const multerConfig_1 = __importDefault(require("../../config/multerConfig"));
exports.enquiryFromRoute = express_1.default.Router();
exports.enquiryFromRoute.post('/create', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.COUNSELOR, constants_1.UserRoles.BASIC_USER]), // yes i know that every one has this basic user role so in a way its available to ALL.
enquiryFormController_1.createEnquiry);
exports.enquiryFromRoute.put('/update', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.COUNSELOR, constants_1.UserRoles.BASIC_USER]), // yes i know that every one has this basic user role so in a way its available to ALL.
enquiryFormController_1.updateEnquiryData);
exports.enquiryFromRoute.get('/get', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.COUNSELOR, constants_1.UserRoles.BASIC_USER]), // yes i know that every one has this basic user role so in a way its available to ALL.
enquiryFormController_1.getEnquiryData);
exports.enquiryFromRoute.put('/update-document', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), // yes i know that every one has this basic user role so in a way its available to ALL.
multerConfig_1.default.single('document'), enquiryFormController_1.updateEnquiryDocuments);
