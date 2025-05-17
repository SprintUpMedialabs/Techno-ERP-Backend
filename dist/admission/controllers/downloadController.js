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
exports.downloadAdmissionForm = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const student_1 = require("../../student/models/student");
const courseMetadata_1 = require("../../course/models/courseMetadata");
const collegeMetaData_1 = require("../models/collegeMetaData");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const formatResponse_1 = require("../../utils/formatResponse");
const enquiry_1 = require("../models/enquiry");
exports.downloadAdmissionForm = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { studentId } = req.body;
    const student = yield student_1.Student.findById(studentId);
    const enquiry = yield enquiry_1.Enquiry.findById(studentId);
    const course = yield courseMetadata_1.CourseMetaData.findOne({ courseCode: student === null || student === void 0 ? void 0 : student.courseCode });
    const collegeMetaData = yield collegeMetaData_1.CollegeMetaData.findOne({ collegeName: course === null || course === void 0 ? void 0 : course.collegeName });
    const responseObj = {
        fullCollegeName: collegeMetaData === null || collegeMetaData === void 0 ? void 0 : collegeMetaData.fullCollegeName,
        affiliationName: collegeMetaData === null || collegeMetaData === void 0 ? void 0 : collegeMetaData.fullAffiliation,
        websiteUrl: collegeMetaData === null || collegeMetaData === void 0 ? void 0 : collegeMetaData.websiteLink,
        collegeEmail: collegeMetaData === null || collegeMetaData === void 0 ? void 0 : collegeMetaData.collegeEmail,
        collegeContact: collegeMetaData === null || collegeMetaData === void 0 ? void 0 : collegeMetaData.collegeContact,
        courseName: course === null || course === void 0 ? void 0 : course.fullCourseName,
        studentName: student === null || student === void 0 ? void 0 : student.studentInfo.studentName,
        studentPhoneNumber: student === null || student === void 0 ? void 0 : student.studentInfo.studentPhoneNumber,
        fatherName: student === null || student === void 0 ? void 0 : student.studentInfo.fatherName,
        fatherPhoneNumber: student === null || student === void 0 ? void 0 : student.studentInfo.fatherPhoneNumber,
        motherName: student === null || student === void 0 ? void 0 : student.studentInfo.motherName,
        motherPhoneNumber: student === null || student === void 0 ? void 0 : student.studentInfo.motherPhoneNumber,
        admissionDate: (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(enquiry === null || enquiry === void 0 ? void 0 : enquiry.dateOfAdmission), //DTODO : Change with original value
        dateOfBirth: (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(student === null || student === void 0 ? void 0 : student.studentInfo.dateOfBirth),
        emailId: student === null || student === void 0 ? void 0 : student.studentInfo.emailId,
        gender: student === null || student === void 0 ? void 0 : student.studentInfo.gender,
        religion: student === null || student === void 0 ? void 0 : student.studentInfo.religion,
        bloodGroup: student === null || student === void 0 ? void 0 : student.studentInfo.bloodGroup,
        category: student === null || student === void 0 ? void 0 : student.studentInfo.category,
        aadharNumber: student === null || student === void 0 ? void 0 : student.studentInfo.aadharNumber,
        stateOfDomicile: student === null || student === void 0 ? void 0 : student.studentInfo.stateOfDomicile,
        areaType: student === null || student === void 0 ? void 0 : student.studentInfo.areaType,
        nationality: student === null || student === void 0 ? void 0 : student.studentInfo.nationality,
        address: (student === null || student === void 0 ? void 0 : student.studentInfo.address.addressLine1) + ", " + (student === null || student === void 0 ? void 0 : student.studentInfo.address.addressLine2) + ", " + (student === null || student === void 0 ? void 0 : student.studentInfo.address.district) + ", " + (student === null || student === void 0 ? void 0 : student.studentInfo.address.state) + ", " + (student === null || student === void 0 ? void 0 : student.studentInfo.address.country),
        pincode: student === null || student === void 0 ? void 0 : student.studentInfo.address.pincode,
        state: student === null || student === void 0 ? void 0 : student.studentInfo.address.state,
        academicDetails: (student === null || student === void 0 ? void 0 : student.studentInfo.academicDetails) || [],
        entranceExamDetails: (student === null || student === void 0 ? void 0 : student.studentInfo.entranceExamDetails) || {},
    };
    return (0, formatResponse_1.formatResponse)(res, 200, "Fetched the reciept data successfully!", true, responseObj);
}));
