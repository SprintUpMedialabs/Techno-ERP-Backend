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
exports.formatDropdownValue = exports.formatCapital = exports.updateOnlyOneValueInDropDown = exports.updateDropDownByType = exports.getDropDownDataByType = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const constants_1 = require("../../config/constants");
const http_errors_1 = __importDefault(require("http-errors"));
const dropDownMetaDeta_1 = require("./dropDownMetaDeta");
const formatResponse_1 = require("../../utils/formatResponse");
const logger_1 = __importDefault(require("../../config/logger"));
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
    // Test: we need to test whether updated values are sorted or not
    const sortedValues = value.sort((a, b) => a.localeCompare(b));
    try {
        yield dropDownMetaDeta_1.DropDownMetaData.findOneAndUpdate({ type }, { value: sortedValues }, { new: true, runValidators: true });
    }
    catch (error) {
        logger_1.default.error(`Error updating dropdown by type: ${type}`, error);
    }
});
exports.updateDropDownByType = updateDropDownByType;
const updateOnlyOneValueInDropDown = (type, value) => __awaiter(void 0, void 0, void 0, function* () {
    if (!value)
        return;
    let formattedValue;
    if (type == constants_1.DropDownType.FIX_COURSE || type == constants_1.DropDownType.COURSE) {
        formattedValue = (0, exports.formatCapital)(value);
    }
    else {
        formattedValue = (0, exports.formatDropdownValue)(value);
    }
    const dropdown = yield dropDownMetaDeta_1.DropDownMetaData.findOne({ type });
    const dropdownSet = new Set((dropdown === null || dropdown === void 0 ? void 0 : dropdown.value) || []);
    dropdownSet.add(formattedValue);
    const sortedValues = Array.from(dropdownSet).sort((a, b) => a.localeCompare(b));
    try {
        yield dropDownMetaDeta_1.DropDownMetaData.findOneAndUpdate({ type }, { value: sortedValues }, { new: true, runValidators: true });
    }
    catch (error) {
        logger_1.default.error(`Error updating only one value in dropdown by type: ${type}`, error);
    }
});
exports.updateOnlyOneValueInDropDown = updateOnlyOneValueInDropDown;
const formatCapital = (input) => {
    return input
        .toUpperCase();
};
exports.formatCapital = formatCapital;
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
