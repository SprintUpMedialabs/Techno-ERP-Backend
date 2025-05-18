"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.piplineRouter = void 0;
const express_1 = require("express");
const constants_1 = require("../config/constants");
const jwtAuthenticationMiddleware_1 = require("../middleware/jwtAuthenticationMiddleware");
const controller_1 = require("./controller");
exports.piplineRouter = (0, express_1.Router)();
exports.piplineRouter.get('/send-summary-email', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.BASIC_USER]), controller_1.sendTodayPipelineSummaryEmail);
