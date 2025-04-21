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
const checkIfStudentAdmitted_1 = require("./checkIfStudentAdmitted");
const updateFeeDetails = (applicationStatusList, studentFeesData) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const validation = studentFees_2.feesUpdateSchema.safeParse(studentFeesData);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const enquiry = yield enquiry_1.Enquiry.findOne({
        studentFee: studentFeesData.id,
        applicationStatus: { $nin: [...applicationStatusList] }
    }, {
        course: 1, // Only return course field
        telecaller: 1,
        counsellor: 1
    })
        .lean();
    if (!enquiry) {
        throw (0, http_errors_1.default)(404, 'Could not find valid Enquiry');
    }
    yield (0, checkIfStudentAdmitted_1.checkIfStudentAdmitted)(enquiry._id);
    const otherFees = yield (0, courseAndOtherFees_controller_1.fetchOtherFees)();
    const semWiseFee = yield (0, courseAndOtherFees_controller_1.fetchCourseFeeByCourse)((_a = enquiry === null || enquiry === void 0 ? void 0 : enquiry.course.toString()) !== null && _a !== void 0 ? _a : '');
    const feeData = Object.assign(Object.assign({}, validation.data), { otherFees: validation.data.otherFees.map(fee => {
            var _a, _b;
            return (Object.assign(Object.assign({}, fee), { feeAmount: (_b = (_a = otherFees === null || otherFees === void 0 ? void 0 : otherFees.find(otherFee => otherFee.type == fee.type)) === null || _a === void 0 ? void 0 : _a.fee) !== null && _b !== void 0 ? _b : 0 }));
        }), semWiseFees: validation.data.semWiseFees.map((semFee, index) => {
            var _a;
            return ({
                finalFee: semFee.finalFee,
                feeAmount: (_a = (semWiseFee === null || semWiseFee === void 0 ? void 0 : semWiseFee.fee[index])) !== null && _a !== void 0 ? _a : 0
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
    if (Object.keys(enquiryUpdatePayload).length > 0) {
        yield enquiry_1.Enquiry.findByIdAndUpdate(enquiry._id, {
            $set: enquiryUpdatePayload
        });
    }
    if (!feesDraft) {
        throw (0, http_errors_1.default)(404, 'Failed to update Fees Details');
    }
    return Object.assign(Object.assign({}, feesDraft), { telecaller: enquiryUpdatePayload.telecaller ? enquiryUpdatePayload.telecaller : enquiry.telecaller, counsellor: enquiryUpdatePayload.counsellor ? enquiryUpdatePayload.counsellor : enquiry.counsellor });
});
exports.updateFeeDetails = updateFeeDetails;
