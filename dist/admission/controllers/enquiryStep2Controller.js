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
exports.updateEnquiryStep2ById = exports.createEnquiryStep2 = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../../config/constants");
const functionLevelLogging_1 = require("../../config/functionLevelLogging");
const courseAndOtherFees_controller_1 = require("../../fees/courseAndOtherFees.controller");
const formatResponse_1 = require("../../utils/formatResponse");
const enquiry_1 = require("../models/enquiry");
const studentFees_1 = require("../models/studentFees");
const studentFeesDraft_1 = require("../models/studentFeesDraft");
const studentFees_2 = require("../validators/studentFees");
exports.createEnquiryStep2 = (0, express_async_handler_1.default)((0, functionLevelLogging_1.functionLevelLogger)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const data = req.body;
    const validation = studentFees_2.feesRequestSchema.safeParse(data);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const enquiry = yield enquiry_1.Enquiry.findOne({
        _id: validation.data.enquiryId,
        applicationStatus: constants_1.ApplicationStatus.STEP_2
    }, {
        course: 1,
        studentFeeDraft: 1,
    }).lean();
    if (!enquiry) {
        throw (0, http_errors_1.default)(404, 'Enquiry with particular ID not found!');
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const otherFees = yield (0, courseAndOtherFees_controller_1.fetchOtherFees)(enquiry === null || enquiry === void 0 ? void 0 : enquiry.course);
        const semWiseFee = yield (0, courseAndOtherFees_controller_1.fetchCourseFeeByCourse)(enquiry === null || enquiry === void 0 ? void 0 : enquiry.course);
        // console.log("Other fees is : ", otherFees);
        // console.log("Semwise fee is : ", semWiseFee);
        if (!semWiseFee) {
            throw (0, http_errors_1.default)(500, 'Semester-wise fee structure not found for the course');
        }
        const _e = validation.data, { counsellor, telecaller } = _e, feeRelatedData = __rest(_e, ["counsellor", "telecaller"]);
        const sem1FeeDepositedTOA = (_c = (_b = (_a = feeRelatedData.otherFees) === null || _a === void 0 ? void 0 : _a.find(fee => fee.type === 'SEM1FEE')) === null || _b === void 0 ? void 0 : _b.feesDepositedTOA) !== null && _c !== void 0 ? _c : 0;
        const feeData = Object.assign(Object.assign({}, feeRelatedData), { otherFees: ((_d = feeRelatedData.otherFees) === null || _d === void 0 ? void 0 : _d.map(fee => {
                var _a, _b, _c, _d;
                let feeAmount;
                feeAmount = (_b = (_a = otherFees === null || otherFees === void 0 ? void 0 : otherFees.find(otherFee => otherFee.type === fee.type)) === null || _a === void 0 ? void 0 : _a.amount) !== null && _b !== void 0 ? _b : 0;
                return Object.assign(Object.assign({}, fee), { feeAmount, finalFee: (_c = fee.finalFee) !== null && _c !== void 0 ? _c : 0, feesDepositedTOA: (_d = fee.feesDepositedTOA) !== null && _d !== void 0 ? _d : 0 });
            })) || [], semWiseFees: feeRelatedData.semWiseFees.map((semFee, index) => {
                var _a;
                return ({
                    finalFee: semFee.finalFee,
                    feeAmount: (_a = semWiseFee[index].amount) !== null && _a !== void 0 ? _a : 0,
                    feesPaid: index === 0 ? sem1FeeDepositedTOA : 0,
                });
            }) });
        const feesDraftList = yield studentFees_1.StudentFeesModel.create([feeData], { session });
        const feesDraft = feesDraftList[0];
        const enquiryUpdatePayload = {
            studentFee: feesDraft._id,
            studentFeeDraft: null,
            applicationStatus: constants_1.ApplicationStatus.STEP_3
        };
        if (data.counsellor) {
            enquiryUpdatePayload.counsellor = data.counsellor;
        }
        if (data.telecaller) {
            enquiryUpdatePayload.telecaller = data.telecaller;
        }
        if (data.references != null) {
            enquiryUpdatePayload.references = data.references;
        }
        if (data.srAmount != null) {
            enquiryUpdatePayload.srAmount = data.srAmount;
        }
        if (data.feeDetailsRemark != null) {
            enquiryUpdatePayload.feeDetailsRemark = data.feeDetailsRemark;
        }
        if (data.isFeeApplicable != null) {
            enquiryUpdatePayload.isFeeApplicable = data.isFeeApplicable;
        }
        yield enquiry_1.Enquiry.findByIdAndUpdate(data.enquiryId, { $set: enquiryUpdatePayload }, { new: true, session });
        if (enquiry === null || enquiry === void 0 ? void 0 : enquiry.studentFeeDraft) {
            yield studentFeesDraft_1.StudentFeesDraftModel.findByIdAndDelete(enquiry.studentFeeDraft, { session });
        }
        yield session.commitTransaction();
        session.endSession();
        return (0, formatResponse_1.formatResponse)(res, 201, 'Fees created successfully', true, feesDraft);
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw (0, http_errors_1.default)(error);
    }
})));
exports.updateEnquiryStep2ById = (0, express_async_handler_1.default)((0, functionLevelLogging_1.functionLevelLogger)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // const feesDraftUpdateData: IFeesUpdateSchema = req.body;
    // const feesDraft = await updateFeeDetails([ApplicationStatus.STEP_1, ApplicationStatus.STEP_3, ApplicationStatus.STEP_4], feesDraftUpdateData);
    // return formatResponse(res, 200, 'Fees Draft updated successfully', true, feesDraft);
})));
