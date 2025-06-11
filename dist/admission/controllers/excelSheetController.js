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
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const constants_1 = require("../../config/constants");
const functionLevelLogging_1 = require("../../config/functionLevelLogging");
const student_1 = require("../../student/models/student");
const formatResponse_1 = require("../../utils/formatResponse");
const enquiry_1 = require("../models/enquiry");
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
    const currentYear = (0, moment_timezone_1.default)().year();
    const studentData = yield student_1.Student.aggregate([
        {
            $match: {
                startingYear: currentYear
            }
        },
        {
            $lookup: {
                from: "enquiries", // Ensure this matches the actual collection name in MongoDB (pluralized by default)
                localField: "_id",
                foreignField: "_id",
                as: "enquiry"
            }
        },
        {
            $unwind: {
                path: "$enquiry",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                "studentInfo": 1,
                "semester": 1,
                "telecaller": "$enquiry.telecaller",
                "course": "$enquiry.course",
                "dateOfAdmission": "$enquiry.dateOfAdmission",
                "counsellor": "$enquiry.counsellor",
                "enquiryRemark": "$enquiry.enquiryRemark",
                "feeDetailsRemark": "$enquiry.feeDetailsRemark",
                "registarOfficeRemark": "$enquiry.registarOfficeRemark",
                "financeOfficeRemark": "$enquiry.financeOfficeRemark",
            }
        }
    ]);
    const formattedData = studentData.map(student => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const applicableFee = ((_d = (_c = (_b = (_a = student.semester) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.fees) === null || _c === void 0 ? void 0 : _c.details) === null || _d === void 0 ? void 0 : _d.reduce((acc, fee) => acc + fee.actualFee, 0)) || 0;
        const totalApplicableFee = ((_e = student.semester) === null || _e === void 0 ? void 0 : _e.reduce((acc, sem) => acc + sem.fees.details.reduce((acc, fee) => acc + fee.actualFee, 0), 0)) || 0;
        const finalFee = ((_h = (_g = (_f = student.semester) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.fees) === null || _h === void 0 ? void 0 : _h.totalFinalFee) || 0;
        const totalFinalFee = ((_j = student.semester) === null || _j === void 0 ? void 0 : _j.reduce((acc, sem) => acc + sem.fees.totalFinalFee, 0)) || 0;
        return Object.assign(Object.assign({}, student.studentInfo), { applicableFee,
            finalFee, discountApplicable: applicableFee - finalFee, totalDiscountApplicable: totalApplicableFee - totalFinalFee, telecaller: student.telecaller || [], counsellor: student.counsellor || [], enquiryRemark: student.enquiryRemark || '', feeDetailsRemark: student.feeDetailsRemark || '', registarOfficeRemark: student.registarOfficeRemark || '', financeOfficeRemark: student.financeOfficeRemark || '' });
    });
    return (0, formatResponse_1.formatResponse)(res, 200, 'Recent admission excel sheet data fetched successfully', true, formattedData);
})));
