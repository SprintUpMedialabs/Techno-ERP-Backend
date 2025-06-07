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
exports.updateFeeDetails = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const courseAndOtherFees_controller_1 = require("../../fees/courseAndOtherFees.controller");
const enquiry_1 = require("../models/enquiry");
const studentFees_1 = require("../models/studentFees");
const studentFees_2 = require("../validators/studentFees");
const updateFeeDetails = (applicationStatusList, studentFeesData) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const validation = studentFees_2.feesUpdateSchema.safeParse(studentFeesData);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const enquiry = yield enquiry_1.Enquiry.findOne({
        studentFee: studentFeesData.id,
        applicationStatus: { $in: [...applicationStatusList] }
    }, {
        course: 1, // Only return course field
        telecaller: 1,
        counsellor: 1
    })
        .lean();
    if (!enquiry) {
        throw (0, http_errors_1.default)(404, 'Could not find valid Enquiry');
    }
    const otherFees = yield (0, courseAndOtherFees_controller_1.fetchOtherFees)(enquiry === null || enquiry === void 0 ? void 0 : enquiry.course);
    const semWiseFee = yield (0, courseAndOtherFees_controller_1.fetchCourseFeeByCourse)(enquiry === null || enquiry === void 0 ? void 0 : enquiry.course);
    if (!semWiseFee) {
        throw (0, http_errors_1.default)(500, 'Semester-wise fee structure not found for the course');
    }
    const sem1FeeDepositedTOA = (_c = (_b = (_a = validation.data.otherFees) === null || _a === void 0 ? void 0 : _a.find(fee => fee.type === 'SEM1FEE')) === null || _b === void 0 ? void 0 : _b.feesDepositedTOA) !== null && _c !== void 0 ? _c : 0;
    const feeData = Object.assign(Object.assign({}, validation.data), { otherFees: validation.data.otherFees.map(fee => {
            var _a, _b;
            return (Object.assign(Object.assign({}, fee), { 
                // feeAmount: otherFees?.find(otherFee => otherFee.type == fee.type)?.fee ?? 0
                feeAmount: (_b = (_a = otherFees === null || otherFees === void 0 ? void 0 : otherFees.find(otherFee => otherFee.type === fee.type)) === null || _a === void 0 ? void 0 : _a.amount) !== null && _b !== void 0 ? _b : 0 }));
        }), semWiseFees: validation.data.semWiseFees.map((semFee, index) => {
            var _a;
            return ({
                finalFee: semFee.finalFee,
                // feeAmount: (semWiseFee?.fee[index]) ?? 0
                feeAmount: (_a = (semWiseFee[index].amount)) !== null && _a !== void 0 ? _a : 0,
                feesPaid: index === 0 ? sem1FeeDepositedTOA : 0
            });
        }) });
    const feesDraft = yield studentFees_1.StudentFeesModel.findByIdAndUpdate(studentFeesData.id, { $set: feeData }, { new: true, runValidators: true });
    const enquiryUpdatePayload = {};
    if (studentFeesData.counsellor) {
        enquiryUpdatePayload.counsellor = studentFeesData.counsellor;
    }
    if (studentFeesData.telecaller) {
        enquiryUpdatePayload.telecaller = studentFeesData.telecaller;
    }
    if (validation.data.references != null) {
        enquiryUpdatePayload.references = validation.data.references;
    }
    if (validation.data.srAmount != null) {
        enquiryUpdatePayload.srAmount = validation.data.srAmount;
    }
    if (validation.data.feeDetailsRemark != null) {
        enquiryUpdatePayload.feeDetailsRemark = validation.data.feeDetailsRemark;
    }
    if (validation.data.financeOfficeRemark != null) {
        enquiryUpdatePayload.financeOfficeRemark = validation.data.financeOfficeRemark;
    }
    if (validation.data.isFeeApplicable != null) {
        enquiryUpdatePayload.isFeeApplicable = validation.data.isFeeApplicable;
    }
    if (Object.keys(enquiryUpdatePayload).length > 0) {
        yield enquiry_1.Enquiry.findByIdAndUpdate(enquiry._id, {
            $set: enquiryUpdatePayload
        });
    }
    return Object.assign(Object.assign({}, feesDraft), { telecaller: (_d = enquiryUpdatePayload.telecaller) !== null && _d !== void 0 ? _d : enquiry.telecaller, counsellor: (_e = enquiryUpdatePayload.counsellor) !== null && _e !== void 0 ? _e : enquiry.counsellor });
});
exports.updateFeeDetails = updateFeeDetails;
