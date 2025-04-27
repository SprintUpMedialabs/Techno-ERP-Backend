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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEnquiryDraftStep1 = exports.createEnquiryDraftStep1 = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const formatResponse_1 = require("../../utils/formatResponse");
const enquiry_1 = require("../validators/enquiry");
const http_errors_1 = __importDefault(require("http-errors"));
const enquiryDraft_1 = require("../models/enquiryDraft");
const functionLevelLogging_1 = require("../../config/functionLevelLogging");
const dropDownMetadataController_1 = require("../../utilityModules/dropdown/dropDownMetadataController");
const constants_1 = require("../../config/constants");
exports.createEnquiryDraftStep1 = (0, express_async_handler_1.default)((0, functionLevelLogging_1.functionLevelLogger)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const data = req.body;
    const validation = enquiry_1.enquiryDraftStep1RequestSchema.safeParse(data);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const enquiryDraft = yield enquiryDraft_1.EnquiryDraft.create(validation.data);
    (0, dropDownMetadataController_1.updateOnlyOneValueInDropDown)(constants_1.DropDownType.FIX_CITY, (_a = enquiryDraft === null || enquiryDraft === void 0 ? void 0 : enquiryDraft.address) === null || _a === void 0 ? void 0 : _a.district);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Draft created successfully', true, enquiryDraft);
})));
exports.updateEnquiryDraftStep1 = (0, express_async_handler_1.default)((0, functionLevelLogging_1.functionLevelLogger)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const data = req.body;
    const validation = enquiry_1.enquiryDraftStep1UpdateSchema.safeParse(data);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const _b = validation.data, { id } = _b, newData = __rest(_b, ["id"]);
    const updatedDraft = yield enquiryDraft_1.EnquiryDraft.findByIdAndUpdate(id, { $set: newData }, { new: true, runValidators: true });
    if (!updatedDraft) {
        throw (0, http_errors_1.default)(404, 'Failed to update draft');
    }
    (0, dropDownMetadataController_1.updateOnlyOneValueInDropDown)(constants_1.DropDownType.FIX_CITY, (_a = updatedDraft === null || updatedDraft === void 0 ? void 0 : updatedDraft.address) === null || _a === void 0 ? void 0 : _a.district);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Draft updated successfully', true, updatedDraft);
})));
