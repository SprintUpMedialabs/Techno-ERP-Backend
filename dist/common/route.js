"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadRoute = void 0;
const express_1 = __importDefault(require("express"));
const downloadController_1 = require("../admission/controllers/downloadController");
const downloadController_2 = require("../student/controllers/downloadController");
exports.downloadRoute = express_1.default.Router();
exports.downloadRoute.post('/admission', downloadController_1.downloadAdmissionForm);
exports.downloadRoute.post('/transaction-slip', downloadController_2.downloadTransactionSlip);
