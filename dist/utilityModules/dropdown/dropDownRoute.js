"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dropDownRoute = void 0;
const express_1 = __importDefault(require("express"));
const dropDownMetadataController_1 = require("./dropDownMetadataController");
exports.dropDownRoute = express_1.default.Router();
exports.dropDownRoute.get('/:type', dropDownMetadataController_1.getDropDownDataByType);
