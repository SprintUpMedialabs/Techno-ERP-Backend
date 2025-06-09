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
exports.getTransactionSlipData = exports.downloadAdmissionTransactionSlip = exports.downloadTransactionSlip = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const number_to_words_1 = require("number-to-words");
const collegeMetaData_1 = require("../../admission/models/collegeMetaData");
const formators_1 = require("../../crm/validators/formators");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const formatResponse_1 = require("../../utils/formatResponse");
const collegeTransactionHistory_1 = require("../models/collegeTransactionHistory");
const student_1 = require("../models/student");
exports.downloadTransactionSlip = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { studentId, transactionId } = req.body;
    const responseObj = yield (0, exports.getTransactionSlipData)(studentId, transactionId, false);
    return (0, formatResponse_1.formatResponse)(res, 200, "Transaction Slip Data fetched successfully", true, responseObj);
}));
exports.downloadAdmissionTransactionSlip = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { studentId } = req.body;
    const responseObj = yield (0, exports.getTransactionSlipData)(studentId, "", true);
    console.log("Response Object : ", responseObj);
    return (0, formatResponse_1.formatResponse)(res, 200, "Admission Transaction Slip Data fetched successfully", true, responseObj);
}));
const getTransactionSlipData = (studentId, transactionId, isAdmissionTransactionSlip) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const student = yield student_1.Student.findById(studentId);
    student === null || student === void 0 ? void 0 : student.semester.forEach(semester => {
        console.log(semester.semesterNumber);
        console.log(semester.fees);
        console.log('===============================================');
    });
    if (isAdmissionTransactionSlip)
        transactionId = (_c = (_b = (_a = student === null || student === void 0 ? void 0 : student.transactionHistory) === null || _a === void 0 ? void 0 : _a.at(0)) === null || _b === void 0 ? void 0 : _b.toString()) !== null && _c !== void 0 ? _c : '';
    const collegeTransaction = yield collegeTransactionHistory_1.CollegeTransaction.findById(transactionId);
    const collegeMetaData = yield collegeMetaData_1.CollegeMetaData.findOne({ name: student === null || student === void 0 ? void 0 : student.collegeName });
    const responseObj = {
        collegeName: collegeMetaData === null || collegeMetaData === void 0 ? void 0 : collegeMetaData.fullCollegeName,
        affiliationName: collegeMetaData === null || collegeMetaData === void 0 ? void 0 : collegeMetaData.fullAffiliation,
        collegeFeeEmail: collegeMetaData === null || collegeMetaData === void 0 ? void 0 : collegeMetaData.collegeFeeEmail,
        collegeFeeContactNumber: collegeMetaData === null || collegeMetaData === void 0 ? void 0 : collegeMetaData.collegeFeeContact,
        recieptNumber: collegeTransaction === null || collegeTransaction === void 0 ? void 0 : collegeTransaction.transactionID,
        studentName: student === null || student === void 0 ? void 0 : student.studentInfo.studentName,
        fatherName: student === null || student === void 0 ? void 0 : student.studentInfo.fatherName,
        course: student === null || student === void 0 ? void 0 : student.courseName,
        date: (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(collegeTransaction === null || collegeTransaction === void 0 ? void 0 : collegeTransaction.dateTime),
        category: student === null || student === void 0 ? void 0 : student.studentInfo.category,
        session: student === null || student === void 0 ? void 0 : student.currentAcademicYear,
        particulars: collegeTransaction === null || collegeTransaction === void 0 ? void 0 : collegeTransaction.transactionSettlementHistory,
        remarks: collegeTransaction === null || collegeTransaction === void 0 ? void 0 : collegeTransaction.remark,
        amountInWords: (0, formators_1.toTitleCase)((0, number_to_words_1.toWords)(collegeTransaction === null || collegeTransaction === void 0 ? void 0 : collegeTransaction.amount)) + " Rupees Only",
        transactionType: collegeTransaction === null || collegeTransaction === void 0 ? void 0 : collegeTransaction.txnType
    };
    return responseObj;
});
exports.getTransactionSlipData = getTransactionSlipData;
