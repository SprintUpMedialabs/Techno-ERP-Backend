"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.v1Router = void 0;
const express_1 = __importDefault(require("express"));
const crmV1Routes_1 = require("./crm/routes/crmV1Routes");
exports.v1Router = express_1.default.Router();
exports.v1Router.use('/crm', crmV1Routes_1.crmV1Routes);
