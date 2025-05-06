"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentRoute = void 0;
const express_1 = __importDefault(require("express"));
const studentFeeRoute_1 = require("./studentFeeRoute");
const studentRepo_1 = require("./studentRepo");
exports.studentRoute = express_1.default.Router();
exports.studentRoute.use('/fees', studentFeeRoute_1.studentFeeRoute);
exports.studentRoute.use('/repo', studentRepo_1.studentRepoRoute);
