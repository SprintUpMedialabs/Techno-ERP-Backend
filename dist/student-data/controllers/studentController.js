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
exports.updateStudentFee = exports.updateStudentDocuments = exports.updateStudentById = exports.getStudentDataById = exports.getStudentData = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importDefault(require("mongoose"));
const singleDocumentSchema_1 = require("../../admission/validators/singleDocumentSchema");
const constants_1 = require("../../config/constants");
const s3Upload_1 = require("../../config/s3Upload");
const formatResponse_1 = require("../../utils/formatResponse");
const student_1 = require("../models/student");
const student_2 = require("../validators/student");
const studentFilterSchema_1 = require("../validators/studentFilterSchema");
const logger_1 = __importDefault(require("../../config/logger"));
const studentFees_1 = require("../../admission/validators/studentFees");
const courseAndOtherFees_controller_1 = require("../../fees/courseAndOtherFees.controller");
const studentFees_2 = require("../../admission/models/studentFees");
exports.getStudentData = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { search, semester, course } = req.body;
    const studentFilter = {};
    if (semester) {
        studentFilter.semester = semester;
    }
    if (course) {
        studentFilter.course = course;
    }
    const validation = studentFilterSchema_1.studentFilterSchema.safeParse(studentFilter);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const baseFilter = {
        $or: [
            { studentName: { $regex: search || "", $options: 'i' } },
            { universityId: { $regex: search || "", $options: 'i' } }
        ],
    };
    const filter = Object.assign(Object.assign({}, baseFilter), studentFilter);
    const students = yield student_1.Student.find(filter)
        .select({
        universityId: 1,
        studentName: 1,
        studentPhoneNumber: 1,
        fatherName: 1,
        fatherPhoneNumber: 1,
        course: 1,
        semester: 1
    });
    if (students.length > 0) {
        return (0, formatResponse_1.formatResponse)(res, 200, 'Students corresponding to your search', true, students);
    }
    else {
        return (0, formatResponse_1.formatResponse)(res, 200, 'No students found with this information', true);
    }
}));
exports.getStudentDataById = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw (0, http_errors_1.default)(400, 'Invalid ID');
    }
    const student = yield student_1.Student.findById(id).populate('studentFee');
    if (!student) {
        throw (0, http_errors_1.default)(404, 'Student Details not found');
    }
    return (0, formatResponse_1.formatResponse)(res, 200, 'Student details fetched successfully', true, student);
}));
exports.updateStudentById = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const studentUpdateData = req.body;
    const validation = student_2.updateStudentSchema.safeParse(studentUpdateData);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const updatedStudent = yield student_1.Student.findByIdAndUpdate({ _id: studentUpdateData.id }, { $set: validation.data }, { new: true, runValidators: true });
    if (!updatedStudent) {
        throw (0, http_errors_1.default)(404, 'Error occurred updating student');
    }
    return (0, formatResponse_1.formatResponse)(res, 200, 'Student Updated Successfully', true, updatedStudent);
}));
exports.updateStudentDocuments = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id, type, dueBy } = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw (0, http_errors_1.default)(400, 'Invalid enquiry ID');
    }
    const file = req.file;
    const validation = singleDocumentSchema_1.singleDocumentSchema.safeParse({
        id: id,
        type: type,
        dueBy: dueBy,
        file: file
    });
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    // Fetch existing document details
    const existingDocument = yield student_1.Student.findOne({ _id: id, 'documents.type': type }, { 'documents.$': 1 });
    let fileUrl;
    let finalDueBy;
    if (existingDocument === null || existingDocument === void 0 ? void 0 : existingDocument.documents) {
        fileUrl = (_a = existingDocument === null || existingDocument === void 0 ? void 0 : existingDocument.documents[0]) === null || _a === void 0 ? void 0 : _a.fileUrl;
        finalDueBy = (_b = existingDocument === null || existingDocument === void 0 ? void 0 : existingDocument.documents[0]) === null || _b === void 0 ? void 0 : _b.dueBy;
    }
    if (file) {
        fileUrl = yield (0, s3Upload_1.uploadToS3)(id.toString(), constants_1.ADMISSION, type, file);
        if (req.file) {
            req.file.buffer = null;
        }
    }
    if (dueBy) {
        finalDueBy = dueBy;
    }
    if (existingDocument) {
        if (!file && !dueBy) {
            throw (0, http_errors_1.default)(400, 'No new data provided to update');
        }
        const updateFields = {};
        if (fileUrl) {
            updateFields['documents.$[elem].fileUrl'] = fileUrl;
        }
        if (finalDueBy) {
            updateFields['documents.$[elem].dueBy'] = finalDueBy;
        }
        logger_1.default.info(updateFields);
        const updatedData = yield student_1.Student.findOneAndUpdate({ _id: id, 'documents.type': type }, { $set: updateFields }, {
            new: true,
            runValidators: true,
            arrayFilters: [{ 'elem.type': type }],
        });
        return (0, formatResponse_1.formatResponse)(res, 200, 'Document updated successfully', true, updatedData);
    }
    else {
        const documentData = { type, fileUrl };
        if (finalDueBy) {
            documentData.dueBy = finalDueBy;
        }
        const updatedData = yield student_1.Student.findByIdAndUpdate(id, {
            $push: { documents: documentData },
        }, { new: true, runValidators: true });
        return (0, formatResponse_1.formatResponse)(res, 200, 'New document created successfully', true, updatedData);
    }
}));
exports.updateStudentFee = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const feesDraftUpdateData = req.body;
    const validation = studentFees_1.feesUpdateSchema.safeParse(feesDraftUpdateData);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const studentFeeInfo = yield student_1.Student.findOne({
        studentFee: feesDraftUpdateData.id,
    }, {
        course: 1
    }).lean();
    const otherFees = yield (0, courseAndOtherFees_controller_1.fetchOtherFees)();
    const semWiseFee = yield (0, courseAndOtherFees_controller_1.fetchCourseFeeByCourse)((_a = studentFeeInfo === null || studentFeeInfo === void 0 ? void 0 : studentFeeInfo.course.toString()) !== null && _a !== void 0 ? _a : '');
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
    const feesDraft = yield studentFees_2.StudentFeesModel.findByIdAndUpdate(feesDraftUpdateData.id, { $set: feeData }, { new: true, runValidators: true });
    if (!feesDraft) {
        throw (0, http_errors_1.default)(404, 'Failed to update Fees Draft');
    }
    return (0, formatResponse_1.formatResponse)(res, 200, 'Fees Draft updated successfully', true, feesDraft);
}));
