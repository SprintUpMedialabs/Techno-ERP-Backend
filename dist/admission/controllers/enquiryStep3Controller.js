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
exports.updateEnquiryDocuments = exports.updateEnquiryStep3ById = exports.saveStep3Draft = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const constants_1 = require("../../config/constants");
const formatResponse_1 = require("../../utils/formatResponse");
const checkIfStudentAdmitted_1 = require("../helpers/checkIfStudentAdmitted");
const enquiry_1 = require("../models/enquiry");
const enquiry_2 = require("../validators/enquiry");
const functionLevelLogging_1 = require("../../config/functionLevelLogging");
const mongoose_1 = __importDefault(require("mongoose"));
const s3Upload_1 = require("../../config/s3Upload");
const singleDocumentSchema_1 = require("../validators/singleDocumentSchema");
const dropDownMetadataController_1 = require("../../utilityModules/dropdown/dropDownMetadataController");
exports.saveStep3Draft = (0, express_async_handler_1.default)((0, functionLevelLogging_1.functionLevelLogger)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const data = req.body;
    const validation = enquiry_2.enquiryDraftStep3Schema.safeParse(data);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const _b = validation.data, { id } = _b, validatedData = __rest(_b, ["id"]);
    const enquiry = yield enquiry_1.Enquiry.findByIdAndUpdate(id, Object.assign({}, validatedData), { new: true, runValidators: true });
    (0, dropDownMetadataController_1.updateOnlyOneValueInDropDown)(constants_1.DropDownType.FIX_CITY, (_a = enquiry === null || enquiry === void 0 ? void 0 : enquiry.address) === null || _a === void 0 ? void 0 : _a.district);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Created Step 3 draft successfully', true, enquiry);
})));
exports.updateEnquiryStep3ById = (0, express_async_handler_1.default)((0, functionLevelLogging_1.functionLevelLogger)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const validation = enquiry_2.enquiryStep3UpdateRequestSchema.safeParse(req.body);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const _b = validation.data, { id } = _b, data = __rest(_b, ["id"]);
    yield (0, checkIfStudentAdmitted_1.checkIfStudentAdmitted)(id);
    const enquiry = yield enquiry_1.Enquiry.findOne({
        _id: id,
        applicationStatus: { $ne: constants_1.ApplicationStatus.STEP_1 }
    }, { applicationStatus: 1 });
    if (!enquiry) {
        // is it can't happen that id was not exists so case which is possible is that ki student only did step1 and came to register [we are ignoring postman possibility here]
        throw (0, http_errors_1.default)(400, "Please complete step 1 first");
    }
    const updatedData = yield enquiry_1.Enquiry.findByIdAndUpdate(id, Object.assign({}, data), { new: true, runValidators: true });
    (0, dropDownMetadataController_1.updateOnlyOneValueInDropDown)(constants_1.DropDownType.FIX_CITY, (_a = updatedData === null || updatedData === void 0 ? void 0 : updatedData.address) === null || _a === void 0 ? void 0 : _a.district);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Enquiry data updated successfully', true, updatedData);
})));
exports.updateEnquiryDocuments = (0, express_async_handler_1.default)((0, functionLevelLogging_1.functionLevelLogger)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    yield (0, checkIfStudentAdmitted_1.checkIfStudentAdmitted)(id);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    // Fetch existing document details
    const existingDocument = yield enquiry_1.Enquiry.findOne({ _id: id, 'documents.type': type }, { 'documents.$': 1 });
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
        const updatedData = yield enquiry_1.Enquiry.findOneAndUpdate({ _id: id, 'documents.type': type }, { $set: updateFields }, {
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
        const updatedData = yield enquiry_1.Enquiry.findByIdAndUpdate(id, { $push: { documents: documentData } }, { new: true, runValidators: true });
        return (0, formatResponse_1.formatResponse)(res, 200, 'New document created successfully', true, updatedData);
    }
})));
