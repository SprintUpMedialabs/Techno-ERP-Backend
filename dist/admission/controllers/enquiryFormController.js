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
exports.updateStatus = exports.approveEnquiry = exports.getEnquiryById = exports.getEnquiryData = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../../config/constants");
const student_1 = require("../../student-data/models/student");
const student_2 = require("../../student-data/validators/student");
const formatResponse_1 = require("../../utils/formatResponse");
const commonSchema_1 = require("../../validators/commonSchema");
const enquiry_1 = require("../models/enquiry");
const enquiryDraft_1 = require("../models/enquiryDraft");
const enquiryIdMetaDataSchema_1 = require("../models/enquiryIdMetaDataSchema");
const enquiryStatusUpdateSchema_1 = require("../validators/enquiryStatusUpdateSchema");
const checkIfStudentAdmitted_1 = require("../helpers/checkIfStudentAdmitted");
const functionLevelLogging_1 = require("../../config/functionLevelLogging");
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
    const { id } = req.body;
    const validation = commonSchema_1.objectIdSchema.safeParse(id);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    yield (0, checkIfStudentAdmitted_1.checkIfStudentAdmitted)(id);
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const enquiry = yield enquiry_1.Enquiry.findById(id).session(session);
        if (!enquiry) {
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
                applicationStatus: constants_1.ApplicationStatus.STEP_4,
            },
        }, { runValidators: true, new: true, projection: { createdAt: 0, updatedAt: 0, __v: 0 }, session });
        const studentValidation = student_2.studentSchema.safeParse(approvedEnquiry);
        if (!studentValidation.success)
            throw (0, http_errors_1.default)(400, studentValidation.error.errors[0]);
        const student = yield student_1.Student.create([Object.assign({ _id: enquiry._id }, studentValidation.data)], { session });
        yield session.commitTransaction();
        session.endSession();
        return (0, formatResponse_1.formatResponse)(res, 200, 'Student created successfully with this information', true, student);
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
})));
exports.updateStatus = ((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const updateStatusData = req.body;
    const validation = enquiryStatusUpdateSchema_1.enquiryStatusUpdateSchema.safeParse(updateStatusData);
    if (!validation.success) {
        throw (0, http_errors_1.default)(404, validation.error.errors[0]);
    }
    let updateEnquiryStatus = yield enquiry_1.Enquiry.findByIdAndUpdate(updateStatusData.id, { $set: { applicationStatus: updateStatusData.newStatus } }, { runValidators: true });
    if (!updateEnquiryStatus) {
        throw (0, http_errors_1.default)(404, 'Could not update the enquiry status');
    }
    else {
        return (0, formatResponse_1.formatResponse)(res, 200, 'Enquiry Status Updated Successfully', true);
    }
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
