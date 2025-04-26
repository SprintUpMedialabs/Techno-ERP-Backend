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
exports.updateFeeDraft = exports.createFeeDraft = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const constants_1 = require("../../config/constants");
const courseAndOtherFees_controller_1 = require("../../fees/courseAndOtherFees.controller");
const formatResponse_1 = require("../../utils/formatResponse");
const enquiry_1 = require("../models/enquiry");
const studentFeesDraft_1 = require("../models/studentFeesDraft");
const studentFees_1 = require("../validators/studentFees");
const functionLevelLogging_1 = require("../../config/functionLevelLogging");
exports.createFeeDraft = (0, express_async_handler_1.default)((0, functionLevelLogging_1.functionLevelLogger)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const data = req.body;
    const validation = studentFees_1.feesDraftRequestSchema.safeParse(data);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0].message);
    }
    const enquiry = yield enquiry_1.Enquiry.findOne({
        _id: data.enquiryId,
        applicationStatus: constants_1.ApplicationStatus.STEP_2
    }, { course: 1 })
        .lean();
    if (!enquiry) {
        throw (0, http_errors_1.default)(400, 'Valid enquiry does not exist. Please complete step 1 first!');
    }
    const otherFees = yield (0, courseAndOtherFees_controller_1.fetchOtherFees)();
    const semWiseFee = yield (0, courseAndOtherFees_controller_1.fetchCourseFeeByCourse)(enquiry.course.toString());
    const _c = validation.data, { counsellor, telecaller } = _c, feeRelatedData = __rest(_c, ["counsellor", "telecaller"]);
    const feeData = Object.assign(Object.assign({}, feeRelatedData), { otherFees: ((_a = feeRelatedData.otherFees) === null || _a === void 0 ? void 0 : _a.map(fee => {
            var _a, _b, _c, _d, _e;
            let feeAmount = fee.feeAmount;
            if (fee.type === constants_1.FeeType.SEM1FEE) {
                feeAmount = (_a = semWiseFee === null || semWiseFee === void 0 ? void 0 : semWiseFee.fee[0]) !== null && _a !== void 0 ? _a : 0;
            }
            else {
                feeAmount = (_c = feeAmount !== null && feeAmount !== void 0 ? feeAmount : (_b = otherFees === null || otherFees === void 0 ? void 0 : otherFees.find(otherFee => otherFee.type === fee.type)) === null || _b === void 0 ? void 0 : _b.fee) !== null && _c !== void 0 ? _c : 0;
            }
            return Object.assign(Object.assign({}, fee), { feeAmount, finalFee: (_d = fee.finalFee) !== null && _d !== void 0 ? _d : 0, feesDepositedTOA: (_e = fee.feesDepositedTOA) !== null && _e !== void 0 ? _e : 0 });
        })) || [], semWiseFees: ((_b = feeRelatedData.semWiseFees) === null || _b === void 0 ? void 0 : _b.map((semFee, index) => {
            var _a, _b, _c;
            return ({
                feeAmount: (_b = (_a = semFee.feeAmount) !== null && _a !== void 0 ? _a : semWiseFee === null || semWiseFee === void 0 ? void 0 : semWiseFee.fee[index]) !== null && _b !== void 0 ? _b : 0,
                finalFee: (_c = semFee.finalFee) !== null && _c !== void 0 ? _c : 0
            });
        })) || [] });
    const feesDraft = yield studentFeesDraft_1.StudentFeesDraftModel.create(feeData);
    yield enquiry_1.Enquiry.findByIdAndUpdate(data.enquiryId, { $set: { studentFeeDraft: feesDraft._id, counsellor, telecaller } });
    return (0, formatResponse_1.formatResponse)(res, 201, 'Fees Draft created successfully', true, feesDraft);
})));
exports.updateFeeDraft = (0, express_async_handler_1.default)((0, functionLevelLogging_1.functionLevelLogger)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let data = req.body;
    const validation = studentFees_1.feesDraftUpdateSchema.safeParse(data);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0].message);
    }
    const enquiry = yield enquiry_1.Enquiry.findOne({
        _id: data.enquiryId,
        applicationStatus: constants_1.ApplicationStatus.STEP_2
    }, { course: 1 })
        .lean();
    if (!enquiry) {
        throw (0, http_errors_1.default)(400, 'Not a valid enquiry');
    }
    const otherFees = yield (0, courseAndOtherFees_controller_1.fetchOtherFees)();
    const semWiseFee = yield (0, courseAndOtherFees_controller_1.fetchCourseFeeByCourse)(enquiry.course.toString());
    // DTODO: remove telecaller and counsellor from updatedData
    const _c = validation.data, { counsellor, telecaller } = _c, feeRelatedData = __rest(_c, ["counsellor", "telecaller"]);
    const updateData = Object.assign(Object.assign({}, feeRelatedData), { otherFees: ((_a = feeRelatedData.otherFees) === null || _a === void 0 ? void 0 : _a.map(fee => {
            var _a, _b, _c, _d, _e;
            let feeAmount = fee.feeAmount;
            if (fee.type === constants_1.FeeType.SEM1FEE) {
                feeAmount = (_a = semWiseFee === null || semWiseFee === void 0 ? void 0 : semWiseFee.fee[0]) !== null && _a !== void 0 ? _a : 0;
            }
            else {
                feeAmount = (_c = feeAmount !== null && feeAmount !== void 0 ? feeAmount : (_b = otherFees === null || otherFees === void 0 ? void 0 : otherFees.find(otherFee => otherFee.type === fee.type)) === null || _b === void 0 ? void 0 : _b.fee) !== null && _c !== void 0 ? _c : 0;
            }
            return Object.assign(Object.assign({}, fee), { feeAmount, finalFee: (_d = fee.finalFee) !== null && _d !== void 0 ? _d : 0, feesDepositedTOA: (_e = fee.feesDepositedTOA) !== null && _e !== void 0 ? _e : 0 });
        })) || [], semWiseFees: ((_b = feeRelatedData.semWiseFees) === null || _b === void 0 ? void 0 : _b.map((semFee, index) => {
            var _a, _b, _c;
            return ({
                feeAmount: (_b = (_a = semFee.feeAmount) !== null && _a !== void 0 ? _a : semWiseFee === null || semWiseFee === void 0 ? void 0 : semWiseFee.fee[index]) !== null && _b !== void 0 ? _b : 0,
                finalFee: (_c = semFee.finalFee) !== null && _c !== void 0 ? _c : 0
            });
        })) || [] });
    const updatedDraft = yield studentFeesDraft_1.StudentFeesDraftModel.findByIdAndUpdate(data.id, { $set: updateData }, { new: true, runValidators: true });
    yield enquiry_1.Enquiry.findByIdAndUpdate(data.enquiryId, { $set: { counsellor, telecaller } });
    return (0, formatResponse_1.formatResponse)(res, 200, 'Fees Draft updated successfully', true, updatedDraft);
})));
