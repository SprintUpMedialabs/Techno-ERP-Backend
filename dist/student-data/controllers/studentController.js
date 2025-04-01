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
exports.updateStudentDocuments = exports.updateStudentById = exports.getStudentDataById = exports.getStudentData = void 0;
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
    // DTODO: neeed to use populate here.
    const student = yield student_1.Student.findById(id);
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
// DATODO : Need to see where the student documents should be stored.
exports.updateStudentDocuments = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, type, dueBy } = req.body;
    const file = req.file;
    const validation = singleDocumentSchema_1.singleDocumentSchema.safeParse({
        enquiryId: id,
        type,
        documentBuffer: file,
        dueBy: dueBy
    });
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const fileUrl = yield (0, s3Upload_1.uploadToS3)(id.toString(), constants_1.ADMISSION, //DTODO : Should we change folder here as it is now Student so.
    type, file);
    //Free memory
    if (req.file)
        req.file.buffer = null;
    const isExists = yield student_1.Student.exists({
        _id: id,
        'documents.type': type,
    });
    console.log("Is Exists : ", isExists);
    let updatedData;
    if (isExists) {
        updatedData = yield student_1.Student.findOneAndUpdate({ _id: id, 'documents.type': type, }, {
            $set: { 'documents.$[elem].fileUrl': fileUrl, dueBy: dueBy },
        }, {
            new: true,
            runValidators: true,
            arrayFilters: [{ 'elem.type': type }],
        });
    }
    else {
        updatedData = yield student_1.Student.findByIdAndUpdate(id, {
            $push: { documents: { type, fileUrl, dueBy } },
        }, { new: true, runValidators: true });
    }
    console.log(updatedData);
    if (!updatedData) {
        throw (0, http_errors_1.default)(400, 'Could not upload documents');
    }
    return (0, formatResponse_1.formatResponse)(res, 200, 'Document uploaded successfully', true, updatedData);
}));
