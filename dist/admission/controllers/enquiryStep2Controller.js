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
const courseAndOtherFees_controller_1 = require("../../fees/courseAndOtherFees.controller");
const formatResponse_1 = require("../../utils/formatResponse");
const checkIfStudentAdmitted_1 = require("../helpers/checkIfStudentAdmitted");
const enquiry_1 = require("../models/enquiry");
const studentFees_1 = require("../models/studentFees");
const studentFees_2 = require("../validators/studentFees");
const updateFeeDetails_1 = require("../helpers/updateFeeDetails");
const studentFeesDraft_1 = require("../models/studentFeesDraft");
const functionLevelLogging_1 = require("../../config/functionLevelLogging");
exports.createEnquiryStep2 = (0, express_async_handler_1.default)((0, functionLevelLogging_1.functionLevelLogger)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const data = req.body;
    const validation = studentFees_2.feesRequestSchema.safeParse(data);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    yield (0, checkIfStudentAdmitted_1.checkIfStudentAdmitted)(validation.data.enquiryId);
    let feesDraft;
    let feesDraftCreated;
    try {
        const enquiry = yield enquiry_1.Enquiry.findOne({
            _id: data.enquiryId,
            applicationStatus: constants_1.ApplicationStatus.STEP_2
        }, {
            course: 1,
            studentFeeDraft: 1,
            // telecaller : 1,
            // counsellor : 1
        }).session(session).lean();
        if (!enquiry) {
            throw (0, http_errors_1.default)(404, 'Enquiry with particular ID not found!');
        }
        const otherFees = yield (0, courseAndOtherFees_controller_1.fetchOtherFees)();
        const semWiseFee = yield (0, courseAndOtherFees_controller_1.fetchCourseFeeByCourse)((_a = enquiry === null || enquiry === void 0 ? void 0 : enquiry.course.toString()) !== null && _a !== void 0 ? _a : '');
        const _c = validation.data, { counsellor, telecaller } = _c, feeRelatedData = __rest(_c, ["counsellor", "telecaller"]);
        const feeData = Object.assign(Object.assign({}, feeRelatedData), { otherFees: ((_b = feeRelatedData.otherFees) === null || _b === void 0 ? void 0 : _b.map(fee => {
                var _a, _b, _c, _d, _e;
                let feeAmount;
                if (fee.type === constants_1.FeeType.SEM1FEE) {
                    feeAmount = (_a = semWiseFee === null || semWiseFee === void 0 ? void 0 : semWiseFee.fee[0]) !== null && _a !== void 0 ? _a : 0;
                }
                else {
                    feeAmount = (_c = (_b = otherFees === null || otherFees === void 0 ? void 0 : otherFees.find(otherFee => otherFee.type === fee.type)) === null || _b === void 0 ? void 0 : _b.fee) !== null && _c !== void 0 ? _c : 0;
                }
                return Object.assign(Object.assign({}, fee), { feeAmount, finalFee: (_d = fee.finalFee) !== null && _d !== void 0 ? _d : 0, feesDepositedTOA: (_e = fee.feesDepositedTOA) !== null && _e !== void 0 ? _e : 0 });
            })) || [], semWiseFees: feeRelatedData.semWiseFees.map((semFee, index) => {
                var _a;
                return ({
                    finalFee: semFee.finalFee,
                    feeAmount: (_a = semWiseFee === null || semWiseFee === void 0 ? void 0 : semWiseFee.fee[index]) !== null && _a !== void 0 ? _a : 0,
                    feesPaid: 0,
                });
            }) });
        feesDraft = yield studentFees_1.StudentFeesModel.create([feeData], { session });
        // feesDraftCreated = {
        //   ...feesDraft,
        //   telecaller : data.telecaller ? data.telecaller : enquiry.telecaller,
        //   counsellor : data.counsellor ? data.counsellor : enquiry.counsellor
        // };
        if (!feesDraft) {
            throw (0, http_errors_1.default)(404, 'Failed to update Fees');
        }
        const enquiryUpdatePayload = {
            studentFee: feesDraft[0]._id,
            studentFeeDraft: null,
        };
        if (data.counsellor) {
            enquiryUpdatePayload.counsellor = data.counsellor;
        }
        if (data.telecaller) {
            enquiryUpdatePayload.telecaller = data.telecaller;
        }
        yield enquiry_1.Enquiry.findByIdAndUpdate(data.enquiryId, { $set: enquiryUpdatePayload }, { new: true, session });
        if (enquiry === null || enquiry === void 0 ? void 0 : enquiry.studentFeeDraft) {
            yield studentFeesDraft_1.StudentFeesDraftModel.findByIdAndDelete(enquiry.studentFeeDraft, { session });
        }
        yield session.commitTransaction();
        session.endSession();
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw (0, http_errors_1.default)('Could not update successfully');
    }
    return (0, formatResponse_1.formatResponse)(res, 201, 'Fees created successfully', true, feesDraftCreated);
})));
exports.updateEnquiryStep2ById = (0, express_async_handler_1.default)((0, functionLevelLogging_1.functionLevelLogger)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const feesDraftUpdateData = req.body;
    const feesDraft = yield (0, updateFeeDetails_1.updateFeeDetails)([constants_1.ApplicationStatus.STEP_1, constants_1.ApplicationStatus.STEP_3, constants_1.ApplicationStatus.STEP_4], feesDraftUpdateData);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Fees Draft updated successfully', true, feesDraft);
})));
