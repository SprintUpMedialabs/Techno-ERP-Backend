"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDropdownValue = exports.updateDropDownByType = exports.getDropDownDataByType = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const constants_1 = require("../../config/constants");
const http_errors_1 = __importDefault(require("http-errors"));
const dropDownMetaDeta_1 = require("./dropDownMetaDeta");
const formatResponse_1 = require("../../utils/formatResponse");
exports.getDropDownDataByType = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type } = req.params;
    // Validate type
    if (!Object.values(constants_1.DropDownType).includes(type)) {
        throw (0, http_errors_1.default)(400, 'Invalid dropdown type');
    }
    const dropdown = yield dropDownMetaDeta_1.DropDownMetaData.findOne({ type });
    if (!dropdown) {
        throw (0, http_errors_1.default)(404, 'Dropdown data not found for given type');
    }
    return (0, formatResponse_1.formatResponse)(res, 200, 'dropdown daa fetched successfully', true, dropdown.value);
}));
const updateDropDownByType = (type, value) => __awaiter(void 0, void 0, void 0, function* () {
    yield dropDownMetaDeta_1.DropDownMetaData.findOneAndUpdate({ type }, { value }, { new: true, runValidators: true });
});
exports.updateDropDownByType = updateDropDownByType;
const formatDropdownValue = (input) => {
    if (!input.trim())
        return '';
    return input
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
exports.formatDropdownValue = formatDropdownValue;
