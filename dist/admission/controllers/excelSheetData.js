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
exports.getRecentAdmissionExcelSheetData = exports.getRecentEnquiryExcelSheetData = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const functionLevelLogging_1 = require("../../config/functionLevelLogging");
const constants_1 = require("../../config/constants");
const enquiry_1 = require("../models/enquiry");
const formatResponse_1 = require("../../utils/formatResponse");
const enquiryDraft_1 = require("../models/enquiryDraft");
exports.getRecentEnquiryExcelSheetData = (0, express_async_handler_1.default)((0, functionLevelLogging_1.functionLevelLogger)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const enquiryData = yield enquiry_1.Enquiry.find({
        applicationStatus: { $ne: constants_1.ApplicationStatus.CONFIRMED }
    });
    const enquiryDraftData = yield enquiryDraft_1.EnquiryDraft.find({
        applicationStatus: { $ne: constants_1.ApplicationStatus.CONFIRMED }
    });
    const allEnquiryData = [...enquiryData, ...enquiryDraftData];
    return (0, formatResponse_1.formatResponse)(res, 200, 'Recent enquiry excel sheet data fetched successfully', true, allEnquiryData);
})));
exports.getRecentAdmissionExcelSheetData = (0, express_async_handler_1.default)((0, functionLevelLogging_1.functionLevelLogger)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const admissionData = yield enquiry_1.Enquiry.find({
        applicationStatus: constants_1.ApplicationStatus.CONFIRMED
    }).populate('studentFee');
    return (0, formatResponse_1.formatResponse)(res, 200, 'Recent admission excel sheet data fetched successfully', true, admissionData);
})));
