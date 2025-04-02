"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.admissionRoute = void 0;
const express_1 = __importDefault(require("express"));
const enquiryFormRoute_1 = require("./enquiryFormRoute");
exports.admissionRoute = express_1.default.Router();
exports.admissionRoute.use('/enquiry', enquiryFormRoute_1.enquiryRoute);
