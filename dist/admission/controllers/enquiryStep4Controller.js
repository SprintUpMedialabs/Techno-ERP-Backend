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
exports.updateEnquiryStep4ById = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const constants_1 = require("../../config/constants");
const formatResponse_1 = require("../../utils/formatResponse");
const updateFeeDetails_1 = require("../helpers/updateFeeDetails");
const functionLevelLogging_1 = require("../../config/functionLevelLogging");
exports.updateEnquiryStep4ById = (0, express_async_handler_1.default)((0, functionLevelLogging_1.functionLevelLogger)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const feesDraftUpdateData = req.body;
    // DA: will update this after having discussion with vb.
    const feesDraft = yield (0, updateFeeDetails_1.updateFeeDetails)([constants_1.ApplicationStatus.STEP_4], feesDraftUpdateData);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Fees Draft updated successfully', true, feesDraft);
})));
