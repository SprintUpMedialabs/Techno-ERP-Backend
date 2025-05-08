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
exports.updateStatus = exports.approveEnquiry = exports.getEnquiryById = exports.getEnquiryData = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../../config/constants");
const functionLevelLogging_1 = require("../../config/functionLevelLogging");
const studentController_1 = require("../../student/controllers/studentController");
const student_1 = require("../../student/models/student");
const studentSchema_1 = require("../../student/validators/studentSchema");
const formatResponse_1 = require("../../utils/formatResponse");
const commonSchema_1 = require("../../validators/commonSchema");
const enquiry_1 = require("../models/enquiry");
const enquiryDraft_1 = require("../models/enquiryDraft");
const enquiryIdMetaDataSchema_1 = require("../models/enquiryIdMetaDataSchema");
const collegeTransactionHistory_1 = require("../../student/models/collegeTransactionHistory");
exports.getEnquiryData = (0, express_async_handler_1.default)((0, functionLevelLogging_1.functionLevelLogger)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { search, applicationStatus } = req.body;
    search !== null && search !== void 0 ? search : (search = '');
    const filter = {
        $or: [
            { studentName: { $regex: search, $options: 'i' } },
            { studentPhoneNumber: { $regex: search, $options: 'i' } }
        ]
    };
    // Validate applicationStatus
    if (applicationStatus) {
        const validStatuses = Object.values(constants_1.ApplicationStatus);
        if (!validStatuses.includes(applicationStatus)) {
            throw (0, http_errors_1.default)(400, 'Invalid application status');
        }
        filter.applicationStatus = applicationStatus;
    }
    const enquiries = yield enquiry_1.Enquiry.find(filter)
        .select({
        _id: 1,
        dateOfEnquiry: 1,
        studentName: 1,
        studentPhoneNumber: 1,
        gender: 1,
        address: 1,
        course: 1,
        applicationStatus: 1,
        fatherPhoneNumber: 1,
        motherPhoneNumber: 1
    });
    const enquiryDrafts = yield enquiryDraft_1.EnquiryDraft.find(filter).select({
        _id: 1,
        dateOfEnquiry: 1,
        studentName: 1,
        studentPhoneNumber: 1,
        gender: 1,
        address: 1,
        course: 1,
        applicationStatus: 1,
        fatherPhoneNumber: 1,
        motherPhoneNumber: 1
    });
    const combinedResults = [...enquiries, ...enquiryDrafts];
    if (combinedResults.length > 0) {
        return (0, formatResponse_1.formatResponse)(res, 200, 'Enquiries corresponding to your search', true, combinedResults);
    }
    else {
        return (0, formatResponse_1.formatResponse)(res, 200, 'No enquiries found with this information', true);
    }
})));
exports.getEnquiryById = (0, express_async_handler_1.default)((0, functionLevelLogging_1.functionLevelLogger)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw (0, http_errors_1.default)(400, 'Invalid enquiry ID');
    }
    let enquiry = yield enquiry_1.Enquiry.findById(id).populate('studentFee').populate('studentFeeDraft');
    if (!enquiry) {
        const enquiryDraft = yield enquiryDraft_1.EnquiryDraft.findById(id);
        if (enquiryDraft) {
            const course = enquiryDraft.course;
            const enquiryPayload = Object.assign(Object.assign({}, enquiryDraft.toObject()), { collegeName: course ? getCollegeName(course) : null, affiliation: course ? getAffiliation(course) : null });
            return (0, formatResponse_1.formatResponse)(res, 200, 'Enquiry draft details', true, enquiryPayload);
        }
        else {
            throw (0, http_errors_1.default)(404, 'Enquiry not found');
        }
    }
    else {
        const course = enquiry.course;
        const enquiryPayload = Object.assign(Object.assign({}, enquiry.toObject()), { collegeName: course ? getCollegeName(course) : null, affiliation: course ? getAffiliation(course) : null });
        return (0, formatResponse_1.formatResponse)(res, 200, 'Enquiry details', true, enquiryPayload);
    }
})));
exports.approveEnquiry = (0, express_async_handler_1.default)((0, functionLevelLogging_1.functionLevelLogger)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id, transactionType } = req.body;
    const validation = commonSchema_1.objectIdSchema.safeParse(id);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    // await checkIfStudentAdmitted(id);
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const enquiry = yield enquiry_1.Enquiry.findById(id).session(session);
        console.log("Enquiry is  : ", enquiry);
        if (!enquiry || enquiry.applicationStatus != constants_1.ApplicationStatus.STEP_4) {
            throw (0, http_errors_1.default)(404, 'Please create the enquiry first!');
        }
        const prefix = getCollegeName(enquiry.course);
        const serial = yield enquiryIdMetaDataSchema_1.EnquiryApplicationId.findOneAndUpdate({ prefix: prefix }, { $inc: { lastSerialNumber: 1 } }, { new: true, runValidators: true, session });
        const formNo = `${prefix}${serial.lastSerialNumber}`;
        const photoSerial = yield enquiryIdMetaDataSchema_1.EnquiryApplicationId.findOneAndUpdate({ prefix: constants_1.FormNoPrefixes.PHOTO }, { $inc: { lastSerialNumber: 1 } }, { new: true, runValidators: true, session });
        const universityId = generateUniversityId(enquiry.course, photoSerial.lastSerialNumber);
        const approvedEnquiry = yield enquiry_1.Enquiry.findByIdAndUpdate(id, {
            $set: {
                formNo: formNo,
                photoNo: photoSerial.lastSerialNumber,
                universityId: universityId,
                applicationStatus: constants_1.ApplicationStatus.CONFIRMED,
            },
        }, { runValidators: true, new: true, projection: { createdAt: 0, updatedAt: 0, __v: 0 }, session });
        // const studentValidation = studentSchema.safeParse(approvedEnquiry);
        const enquiryData = approvedEnquiry === null || approvedEnquiry === void 0 ? void 0 : approvedEnquiry.toObject();
        console.log("Approved ENquiry is : ", enquiryData);
        const studentData = Object.assign(Object.assign({}, enquiryData), { "courseCode": approvedEnquiry === null || approvedEnquiry === void 0 ? void 0 : approvedEnquiry.course, "feeId": approvedEnquiry === null || approvedEnquiry === void 0 ? void 0 : approvedEnquiry.studentFee, "dateOfAdmission": approvedEnquiry === null || approvedEnquiry === void 0 ? void 0 : approvedEnquiry.dateOfAdmission });
        console.log("Student Data : ", studentData);
        const studentValidation = studentSchema_1.CreateStudentSchema.safeParse(studentData);
        console.log("create student schema : ", studentValidation.data);
        console.log("Student Validation Errors : ", studentValidation.error);
        if (!studentValidation.success)
            throw (0, http_errors_1.default)(400, studentValidation.error.errors[0]);
        // const student = await Student.create([{
        //   _id: enquiry._id,
        //   ...studentValidation.data,
        // }], { session });
        const _b = yield (0, studentController_1.createStudent)(studentValidation.data), { transactionAmount } = _b, student = __rest(_b, ["transactionAmount"]);
        const studentCreateValidation = studentSchema_1.StudentSchema.safeParse(student);
        console.log("Student create validation errors : ", studentCreateValidation.error);
        console.log(studentCreateValidation.data);
        if (!studentCreateValidation.success) {
            throw (0, http_errors_1.default)(400, studentCreateValidation.error.errors[0]);
        }
        const createTransaction = yield collegeTransactionHistory_1.CollegeTransaction.create([{
                studentId: enquiry._id,
                dateTime: new Date(),
                feeAction: constants_1.FeeActions.DEPOSIT,
                amount: transactionAmount,
                txnType: transactionType !== null && transactionType !== void 0 ? transactionType : constants_1.TransactionTypes.CASH,
                actionedBy: (_a = req === null || req === void 0 ? void 0 : req.data) === null || _a === void 0 ? void 0 : _a.id
            }], { session });
        const createdStudent = yield student_1.Student.create([Object.assign(Object.assign({ _id: enquiry._id }, studentCreateValidation.data), { transactionHistory: [createTransaction[0]._id] })], { session });
        yield session.commitTransaction();
        session.endSession();
        return (0, formatResponse_1.formatResponse)(res, 200, 'Student created successfully with this information', true, createdStudent);
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
})));
exports.updateStatus = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, formatResponse_1.formatResponse)(res, 200, 'Enquiry Status Updated Successfully', true);
    // const updateStatusData: IEnquiryStatusUpdateSchema = req.body;
    // const validation = enquiryStatusUpdateSchema.safeParse(updateStatusData);
    // if (!validation.success) {
    //   throw createHttpError(404, validation.error.errors[0]);
    // }
    // let updateEnquiryStatus = await Enquiry.findByIdAndUpdate(updateStatusData.id, { $set: { applicationStatus: updateStatusData.newStatus } }, { runValidators: true });
    // if (!updateEnquiryStatus) {
    //   throw createHttpError(404, 'Could not update the enquiry status');
    // }
    // else {
    //   return formatResponse(res, 200, 'Enquiry Status Updated Successfully', true);
    // }
}));
const generateUniversityId = (course, photoSerialNumber) => {
    return `${constants_1.TGI}${new Date().getFullYear().toString()}${course.toString()}${photoSerialNumber.toString()}`;
};
const getCollegeName = (course) => {
    if (course === constants_1.Course.MBA)
        return constants_1.FormNoPrefixes.TIMS;
    if (course === constants_1.Course.LLB)
        return constants_1.FormNoPrefixes.TCL;
    return constants_1.FormNoPrefixes.TIHS;
};
const getAffiliation = (course) => {
    if (course === constants_1.Course.MBA)
        return "Delhi University";
    else if (course === constants_1.Course.BCOM)
        return "Lucknow University";
    else
        return "ABC University";
};
