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
exports.updateEnquiryDocuments = exports.updateStudentById = exports.getStudentDataById = exports.getStudentData = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const formatResponse_1 = require("../../utils/formatResponse");
const enquiry_1 = require("../../admission/models/enquiry");
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../../config/constants");
const s3Upload_1 = require("../../config/s3Upload");
const singleDocumentSchema_1 = require("../../admission/validators/singleDocumentSchema");
const studentFilterSchema_1 = require("../validators/studentFilterSchema");
const buildStudentFilter_1 = require("../utils/buildStudentFilter");
exports.getStudentData = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { search, studentFilter } = req.body;
    // console.log(search);
    // console.log(studentFilter);
    if (!studentFilter) {
        studentFilter = {};
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
        applicationStatus: 'Step_4'
    };
    const filter = Object.assign(Object.assign({}, baseFilter), (0, buildStudentFilter_1.buildStudentFilter)(validation.data));
    const enquiries = yield enquiry_1.Enquiry.find(filter)
        .select({
        universityId: 1,
        studentName: 1,
        studentPhoneNumber: 1,
        fatherName: 1,
        fatherPhoneNumber: 1,
        course: 1,
        semester: 1
    });
    if (enquiries.length > 0) {
        return (0, formatResponse_1.formatResponse)(res, 200, 'Enquiries corresponding to your search', true, enquiries);
    }
    else {
        return (0, formatResponse_1.formatResponse)(res, 200, 'No enquiries found with this information', true);
    }
}));
exports.getStudentDataById = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw (0, http_errors_1.default)(400, 'Invalid ID');
    }
    const enquiry = yield enquiry_1.Enquiry.findById(id)
        .populate('studentFee');
    if (!enquiry) {
        throw (0, http_errors_1.default)(404, 'Student Details not found');
    }
    return (0, formatResponse_1.formatResponse)(res, 200, 'Student details fetched successfully', true, enquiry);
}));
exports.updateStudentById = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
}));
exports.updateEnquiryDocuments = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, type } = req.body;
    const file = req.file;
    const validation = singleDocumentSchema_1.singleDocumentSchema.safeParse({
        enquiryId: id,
        type,
        documentBuffer: file
    });
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const fileUrl = yield (0, s3Upload_1.uploadToS3)(id.toString(), constants_1.ADMISSION, type, file);
    //Free memory
    if (req.file)
        req.file.buffer = null;
    const isExists = yield enquiry_1.Enquiry.exists({
        _id: id,
        'documents.type': type,
    });
    console.log("Is Exists : ", isExists);
    let updatedData;
    if (isExists) {
        updatedData = yield enquiry_1.Enquiry.findOneAndUpdate({ _id: id, 'documents.type': type, }, {
            $set: { 'documents.$[elem].fileUrl': fileUrl },
        }, {
            new: true,
            runValidators: true,
            arrayFilters: [{ 'elem.type': type }],
        });
    }
    else {
        updatedData = yield enquiry_1.Enquiry.findByIdAndUpdate(id, {
            $push: { documents: { type, fileUrl } },
        }, { new: true, runValidators: true });
    }
    console.log(updatedData);
    if (!updatedData) {
        throw (0, http_errors_1.default)(400, 'Could not upload documents');
    }
    return (0, formatResponse_1.formatResponse)(res, 200, 'Document uploaded successfully', true, updatedData);
}));
