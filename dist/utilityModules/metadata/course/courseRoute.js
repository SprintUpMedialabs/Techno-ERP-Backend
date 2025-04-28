"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseRoute = void 0;
const express_1 = __importDefault(require("express"));
const courseController_1 = require("./courseController");
exports.courseRoute = express_1.default.Router();
exports.courseRoute.get('/:courseCode', courseController_1.getDocumentTypeByCourseCode);
