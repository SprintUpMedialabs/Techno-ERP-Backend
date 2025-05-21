"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentParentRoute = void 0;
const express_1 = __importDefault(require("express"));
const studentParentController_1 = require("../controllers/studentParentController");
exports.studentParentRoute = express_1.default.Router();
exports.studentParentRoute.post('/get-info', studentParentController_1.getStudentInformation);
exports.studentParentRoute.post('/schedule-info', studentParentController_1.getScheduleInformation);
