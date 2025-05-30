"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testRoute = void 0;
const constants_1 = require("../../config/constants");
const jwtAuthenticationMiddleware_1 = require("../../middleware/jwtAuthenticationMiddleware");
const express_1 = __importDefault(require("express"));
const testController_1 = require("../controllers/testController");
exports.testRoute = express_1.default.Router();
exports.testRoute.post('/', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), testController_1.deleteFileFromS3UsingUrl);
