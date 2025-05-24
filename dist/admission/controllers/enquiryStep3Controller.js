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
exports.updateEnquiryDocuments = exports.verifyOtpAndUpdateEnquiryStatus = exports.updateEnquiryStep3ById = exports.saveStep3Draft = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../../config/constants");
const functionLevelLogging_1 = require("../../config/functionLevelLogging");
const s3Upload_1 = require("../../config/s3Upload");
const dropDownMetadataController_1 = require("../../utilityModules/dropdown/dropDownMetadataController");
const formatResponse_1 = require("../../utils/formatResponse");
const enquiry_1 = require("../models/enquiry");
const enquiry_2 = require("../validators/enquiry");
const singleDocumentSchema_1 = require("../validators/singleDocumentSchema");
const otpController_1 = require("../../common/otpController");
exports.saveStep3Draft = (0, express_async_handler_1.default)((0, functionLevelLogging_1.functionLevelLogger)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const data = req.body;
    const validation = enquiry_2.enquiryDraftStep3Schema.safeParse(data);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const _b = validation.data, { id } = _b, validatedData = __rest(_b, ["id"]);
    const isEnquiryExists = yield enquiry_1.Enquiry.exists({
        _id: id,
        applicationStatus: constants_1.ApplicationStatus.STEP_3
    });
    if (!isEnquiryExists) {
        throw (0, http_errors_1.default)(400, 'Enquiry not found');
    }
    const enquiry = yield enquiry_1.Enquiry.findByIdAndUpdate(id, Object.assign(Object.assign({}, validatedData), { applicationStatus: constants_1.ApplicationStatus.STEP_3 }), { new: true, runValidators: true });
    (0, dropDownMetadataController_1.updateOnlyOneValueInDropDown)(constants_1.DropDownType.DISTRICT, (_a = enquiry === null || enquiry === void 0 ? void 0 : enquiry.address) === null || _a === void 0 ? void 0 : _a.district);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Created Step 3 draft successfully', true, enquiry);
})));
exports.updateEnquiryStep3ById = (0, express_async_handler_1.default)((0, functionLevelLogging_1.functionLevelLogger)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const validation = enquiry_2.enquiryStep3UpdateRequestSchema.safeParse(req.body);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const _b = validation.data, { id } = _b, data = __rest(_b, ["id"]);
    const isEnquiryExists = yield enquiry_1.Enquiry.exists({
        _id: id,
        applicationStatus: constants_1.ApplicationStatus.STEP_3
    });
    if (!isEnquiryExists) {
        throw (0, http_errors_1.default)(400, 'Enquiry not found');
    }
    // DACHECK: This is a temporary fix to ensure that the enquiry is updated to step 4 after the step 3 is updated till the time frontend is not ready for this feature
    const updatedData = yield enquiry_1.Enquiry.findByIdAndUpdate(id, Object.assign(Object.assign({}, data), { applicationStatus: constants_1.ApplicationStatus.STEP_4 }), { new: true, runValidators: true });
    yield (0, otpController_1.sendOTP)(updatedData.emailId);
    (0, dropDownMetadataController_1.updateOnlyOneValueInDropDown)(constants_1.DropDownType.DISTRICT, (_a = updatedData === null || updatedData === void 0 ? void 0 : updatedData.address) === null || _a === void 0 ? void 0 : _a.district);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Enquiry data updated successfully', true, updatedData);
})));
exports.verifyOtpAndUpdateEnquiryStatus = (0, express_async_handler_1.default)((0, functionLevelLogging_1.functionLevelLogger)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validation = enquiry_2.otpSchemaForStep3.safeParse(req.body);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const { id, otp } = validation.data;
    const enquiry = yield enquiry_1.Enquiry.findOne({ _id: id, applicationStatus: constants_1.ApplicationStatus.STEP_3 });
    if (!enquiry) {
        throw (0, http_errors_1.default)(400, 'Enquiry not found');
    }
    yield (0, otpController_1.validateOTP)(enquiry.emailId, otp);
    yield enquiry_1.Enquiry.findByIdAndUpdate(id, { applicationStatus: constants_1.ApplicationStatus.STEP_4 }, { runValidators: true });
    return (0, formatResponse_1.formatResponse)(res, 200, 'Enquiry status updated successfully', true);
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
    const isEnquiryExists = yield enquiry_1.Enquiry.exists({
        _id: id,
        applicationStatus: constants_1.ApplicationStatus.STEP_3
    });
    if (!isEnquiryExists) {
        throw (0, http_errors_1.default)(400, 'Enquiry not found');
    }
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
