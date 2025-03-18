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
exports.getEnquiryData = exports.updateEnquiryDocuments = exports.updateEnquiryData = exports.createEnquiry = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const enquiryApplicationIdSchema_1 = require("../models/enquiryApplicationIdSchema");
const enquiryForm_1 = require("../models/enquiryForm");
const enquiryForm_2 = require("../validators/enquiryForm");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const s3Upload_1 = require("../../config/s3Upload");
const constants_1 = require("../../config/constants");
const singleDocumentSchema_1 = require("../validators/singleDocumentSchema");
const extractParts = (applicationId) => {
    const match = applicationId.match(/^([A-Za-z]+)(\d+)$/);
    if (match) {
        const prefix = match[1]; //Capture letters
        const serialNumber = parseInt(match[2]); //Capture digits
        return { prefix, serialNumber };
    }
    throw new Error('Invalid applicationId format');
};
exports.createEnquiry = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = req.body;
    const validation = enquiryForm_2.enquiryRequestSchema.safeParse(data);
    if (!validation.success) {
        console.log(validation.error);
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    let savedResult = yield enquiryForm_1.Enquiry.create(Object.assign({}, data));
    //Save the status of updated serial number in db once enquiry object insertion is successful.
    let { prefix, serialNumber } = extractParts(savedResult.applicationId);
    let serial = yield enquiryApplicationIdSchema_1.EnquiryApplicationId.findOne({ prefix: prefix });
    serial.lastSerialNumber = serialNumber;
    yield serial.save();
    res.status(201).json({
        success: true,
        message: 'Enquiry created successfully',
        data: {
            applicationId: savedResult.applicationId
        }
    });
}));
exports.updateEnquiryData = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validation = enquiryForm_2.enquiryUpdateSchema.safeParse(req.body);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const _a = validation.data, { _id } = _a, data = __rest(_a, ["_id"]);
    const updatedData = yield enquiryForm_1.Enquiry.findByIdAndUpdate(_id, Object.assign({}, data), { new: true, runValidators: true });
    if (!updatedData) {
        throw (0, http_errors_1.default)(404, 'Enquiry not found');
    }
    res.status(200).json({
        success: true,
        message: 'Enquiry data updated successfully',
        data: updatedData
    });
}));
// DTODO : 1 -> [1,1] => Resolved
exports.updateEnquiryDocuments = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { _id, type } = req.body;
    const file = req.file;
    const validation = singleDocumentSchema_1.singleDocumentSchema.safeParse({
        studentId: _id,
        type,
        documentBuffer: file
    });
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const fileUrl = yield (0, s3Upload_1.uploadToS3)(_id.toString(), constants_1.ADMISSION, type, file);
    //Free memory
    if (req.file)
        req.file.buffer = null;
    // console.log(`Uploaded file: ${fileUrl}`);
    const updatedData = yield enquiryForm_1.Enquiry.findOneAndUpdate({ _id, 'documents.type': type }, {
        $set: { 'documents.$[elem].fileUrl': fileUrl },
    }, {
        new: true,
        runValidators: true,
        arrayFilters: [{ 'elem.type': type }],
    });
    if (!updatedData) {
        const newData = yield enquiryForm_1.Enquiry.findByIdAndUpdate(_id, {
            $push: { documents: { type, fileUrl } }
        }, { new: true, runValidators: true });
        if (!newData) {
            throw (0, http_errors_1.default)(404, 'Enquiry not found');
        }
        res.status(200).json({
            success: true,
            message: 'Document uploaded successfully',
            data: newData
        });
    }
    else {
        res.status(200).json({
            success: true,
            message: 'Document updated successfully',
            data: updatedData
        });
    }
}));
exports.getEnquiryData = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const search = req.query.search || '';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const query = search
        ? {
            $or: [
                { studentName: { $regex: search, $options: 'i' } },
                { studentPhoneNumber: { $regex: search, $options: 'i' } }
            ]
        }
        : {};
    const [results, totalItems] = yield Promise.all([
        enquiryForm_1.Enquiry.find(query).skip(skip).limit(limit),
        enquiryForm_1.Enquiry.countDocuments(query)
    ]);
    res.status(200).json({
        enquiry: results,
        total: totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page
    });
}));
