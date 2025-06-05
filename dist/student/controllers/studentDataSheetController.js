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
exports.exportStudentData = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const moment_1 = __importDefault(require("moment"));
const user_1 = require("../../auth/models/user");
const constants_1 = require("../../config/constants");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const exceljs_1 = __importDefault(require("exceljs"));
const student_1 = require("../models/student");
const enquiry_1 = require("../../admission/models/enquiry");
const mailer_1 = require("../../config/mailer");
const secrets_1 = require("../../secrets");
const formatResponse_1 = require("../../utils/formatResponse");
const generateAddress = (address) => {
    var _a, _b;
    const addressLine1 = (_a = address.addressLine1) !== null && _a !== void 0 ? _a : '';
    const addressLine2 = (_b = address.addressLine2) !== null && _b !== void 0 ? _b : '';
    return addressLine2 ? ((addressLine1 ? addressLine1 + ", " : '') + addressLine2) : (addressLine1 !== null && addressLine1 !== void 0 ? addressLine1 : '');
};
const getCollegeInformation = (academicDetails) => {
    let collegeDetails = {
        educationLevel: constants_1.EducationLevel.Tenth,
        schoolCollegeName: "",
        universityBoardName: "",
        passingYear: 0,
        percentageObtained: 0
    };
    if (academicDetails.length == 0)
        return collegeDetails;
    academicDetails.forEach(academicDetail => {
        if (academicDetail.educationLevel === constants_1.EducationLevel.Graduation) {
            collegeDetails = academicDetail;
        }
    });
    return collegeDetails;
};
const getPhysicalDocumentNote = (label, physicalDocumentNote) => {
    const note = physicalDocumentNote === null || physicalDocumentNote === void 0 ? void 0 : physicalDocumentNote.find(p => { var _a; return (_a = p.type) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(label.toLowerCase()); });
    if (!note)
        return '';
    if (note.status === 'PENDING') {
        return note.dueBy ? `${note.status} | ${(0, convertDateToFormatedDate_1.convertToDDMMYYYY)(note.dueBy)}` : note.status;
    }
    return note.status || (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(note.dueBy) || '';
};
const getDocument = (label, documents) => {
    const note = documents === null || documents === void 0 ? void 0 : documents.find(p => { var _a; return (_a = p.type) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(label.toLowerCase()); });
    return note ? (note.fileUrl ? note.fileUrl : (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(note.dueBy)) : '';
};
const getStudentState = (createdAt, updatedAt) => {
    const today = (0, moment_1.default)();
    if ((0, moment_1.default)(createdAt).isSame(today, 'day')) {
        return constants_1.StudentStatus.NEW;
    }
    else if ((0, moment_1.default)(updatedAt).isSame(today, 'day')) {
        return constants_1.StudentStatus.UPDATED;
    }
    else {
        return constants_1.StudentStatus.OLD;
    }
};
const mapStudentToRow = (student, index) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4;
    const info = student.studentInfo;
    const enquiry = yield enquiry_1.Enquiry.findById(student._id);
    const academicDetails = info.academicDetails;
    const collegeDetails = getCollegeInformation(academicDetails ? academicDetails : []);
    const physicalDocumentNote = info.physicalDocumentNote;
    const documents = info.documents;
    return {
        "S. No.": index + 1,
        "Student Status": getStudentState(student.createdAt, student.updatedAt),
        "Photo No.": (_a = info.photoNo) !== null && _a !== void 0 ? _a : '',
        "Course": (_b = student.courseName) !== null && _b !== void 0 ? _b : '',
        "LURN/PRE-REGISTRATION NO.": (_c = info.lurnRegistrationNo) !== null && _c !== void 0 ? _c : '',
        "Form No.": (_d = info.formNo) !== null && _d !== void 0 ? _d : '',
        "Date of Admission": (enquiry === null || enquiry === void 0 ? void 0 : enquiry.dateOfAdmission) ? (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(enquiry === null || enquiry === void 0 ? void 0 : enquiry.dateOfAdmission) : '',
        "Name of Student": (_e = info.studentName) !== null && _e !== void 0 ? _e : '',
        "Father's Name": (_f = info.fatherName) !== null && _f !== void 0 ? _f : '',
        "Mother's Name": (_g = info.motherName) !== null && _g !== void 0 ? _g : '',
        "Permanent Address": generateAddress(info.address),
        "District": (_j = (_h = info.address) === null || _h === void 0 ? void 0 : _h.district) !== null && _j !== void 0 ? _j : '',
        "Pincode": (_l = (_k = info.address) === null || _k === void 0 ? void 0 : _k.pincode) !== null && _l !== void 0 ? _l : '',
        "State": (_o = (_m = info.address) === null || _m === void 0 ? void 0 : _m.state) !== null && _o !== void 0 ? _o : '',
        "Country": (_p = info.nationality) !== null && _p !== void 0 ? _p : '',
        "Aadhaar Number": (_q = info.aadharNumber) !== null && _q !== void 0 ? _q : '',
        "Date of Birth": info.dateOfBirth ? (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(info.dateOfBirth) : '',
        "Contact / WhatsApp No. (Student)": (_r = info.studentPhoneNumber) !== null && _r !== void 0 ? _r : '',
        "Contact No. (Parents)": (_s = info.fatherPhoneNumber) !== null && _s !== void 0 ? _s : '',
        "Email": (_t = info.emailId) !== null && _t !== void 0 ? _t : '',
        "Gender": (_u = info.gender) !== null && _u !== void 0 ? _u : '',
        "Religion": (_v = info.religion) !== null && _v !== void 0 ? _v : '',
        "Category": (_w = info.category) !== null && _w !== void 0 ? _w : '',
        "Blood Group": (_x = info.bloodGroup) !== null && _x !== void 0 ? _x : '',
        "Admitted Through": (_y = info.admittedThrough) !== null && _y !== void 0 ? _y : '',
        "College Name": collegeDetails.schoolCollegeName,
        "Board / University": (_z = collegeDetails.universityBoardName) !== null && _z !== void 0 ? _z : '',
        "Year of Passing": (_0 = collegeDetails.passingYear) !== null && _0 !== void 0 ? _0 : '',
        "Aggregate Percentage": (_1 = collegeDetails.percentageObtained) !== null && _1 !== void 0 ? _1 : '',
        "10th Marksheet": getPhysicalDocumentNote("10th Marksheet", physicalDocumentNote !== null && physicalDocumentNote !== void 0 ? physicalDocumentNote : []),
        "12th Marksheet": getPhysicalDocumentNote("12th Marksheet", physicalDocumentNote !== null && physicalDocumentNote !== void 0 ? physicalDocumentNote : []),
        "Graduation Final Year Marksheet": getPhysicalDocumentNote("Graduation Final Year Marksheet", physicalDocumentNote !== null && physicalDocumentNote !== void 0 ? physicalDocumentNote : []),
        "T.C./Migration": getPhysicalDocumentNote("T.C. / Migration", physicalDocumentNote !== null && physicalDocumentNote !== void 0 ? physicalDocumentNote : []),
        "Photo": getDocument("Photo", documents !== null && documents !== void 0 ? documents : []),
        "Caste": getPhysicalDocumentNote("Caste Certificate (If Applicable)", physicalDocumentNote !== null && physicalDocumentNote !== void 0 ? physicalDocumentNote : []),
        "Gap Affidavit": getPhysicalDocumentNote("Gap Affidavit (If Applicable)", physicalDocumentNote !== null && physicalDocumentNote !== void 0 ? physicalDocumentNote : []),
        "Signature": getDocument("Signature", documents !== null && documents !== void 0 ? documents : []),
        "References": (_3 = (_2 = enquiry === null || enquiry === void 0 ? void 0 : enquiry.references) === null || _2 === void 0 ? void 0 : _2.join(", ")) !== null && _3 !== void 0 ? _3 : '',
        "SR Amount": (_4 = enquiry === null || enquiry === void 0 ? void 0 : enquiry.srAmount) !== null && _4 !== void 0 ? _4 : '',
        "Remarks": ""
    };
});
exports.exportStudentData = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    console.log("In student export data");
    const user = yield user_1.User.findById((_a = req.data) === null || _a === void 0 ? void 0 : _a.id);
    console.log("Logged in user is : ", user);
    const students = yield student_1.Student.find({});
    console.log("Students are : ", students);
    const workbook = new exceljs_1.default.Workbook();
    const worksheet = workbook.addWorksheet("Students");
    const firstRow = yield mapStudentToRow(students[0], 0);
    worksheet.columns = Object.keys(firstRow).map(key => ({ header: key, key }));
    for (let i = 0; i < students.length; i++) {
        const row = yield mapStudentToRow(students[i], i);
        worksheet.addRow(row);
    }
    worksheet.columns.forEach(col => {
        var _a;
        let maxLength = 15;
        (_a = col.eachCell) === null || _a === void 0 ? void 0 : _a.call(col, { includeEmpty: true }, cell => {
            const cellValue = cell.text || '';
            maxLength = Math.max(maxLength, cellValue.length);
        });
        col.width = maxLength + 2;
    });
    const formattedDate = (0, moment_1.default)().tz("Asia/Kolkata").format("DD-MM-YY");
    // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    // res.setHeader('Content-Disposition', `attachment; filename="${user?.firstName ?? ''} ${user?.lastName ?? ''} - ${formattedDate}.xlsx"`);
    const buffer = Buffer.from(yield workbook.xlsx.writeBuffer());
    yield (0, mailer_1.sendEmail)(secrets_1.DEVELOPER_EMAIL, "Student Data Backup", `<p>Please find the attached student data exported on ${formattedDate}.</p>`, [{
            filename: `${(_b = user === null || user === void 0 ? void 0 : user.firstName) !== null && _b !== void 0 ? _b : ''} ${(_c = user === null || user === void 0 ? void 0 : user.lastName) !== null && _c !== void 0 ? _c : ''} - ${formattedDate}.xlsx`,
            content: buffer
        }]);
    return (0, formatResponse_1.formatResponse)(res, 200, "Student data sent on your email", true, null);
}));
