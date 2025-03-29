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
exports.updateStatus = exports.approveEnquiry = exports.getEnquiryById = exports.getEnquiryData = exports.updateEnquiryStep4ById = exports.updateEnquiryDocuments = exports.updateEnquiryStep3ById = exports.updateEnquiryStep2ById = exports.createEnquiryStep2 = exports.updateFeeDraft = exports.createFeeDraft = exports.updateEnquiryStep1ById = exports.createEnquiry = exports.updateEnquiryDraftStep1 = exports.createEnquiryDraftStep1 = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const enquiryIdMetaDataSchema_1 = require("../models/enquiryIdMetaDataSchema");
const enquiry_1 = require("../models/enquiry");
const enquiry_2 = require("../validators/enquiry");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const s3Upload_1 = require("../../config/s3Upload");
const constants_1 = require("../../config/constants");
const singleDocumentSchema_1 = require("../validators/singleDocumentSchema");
const formatResponse_1 = require("../../utils/formatResponse");
const studentFees_1 = require("../validators/studentFees");
const studentFees_2 = require("../models/studentFees");
const courseAndOtherFees_controller_1 = require("../../fees/courseAndOtherFees.controller");
const mongoose_1 = __importDefault(require("mongoose"));
const enquiryStatusUpdateSchema_1 = require("../validators/enquiryStatusUpdateSchema");
const commonSchema_1 = require("../../validators/commonSchema");
const enquiryDraft_1 = require("../models/enquiryDraft");
const studentFeesDraft_1 = require("../models/studentFeesDraft");
exports.createEnquiryDraftStep1 = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const enquiryDraftStep1Data = req.body;
    const validation = enquiry_2.enquiryDraftStep1RequestSchema.safeParse(enquiryDraftStep1Data);
    console.log(validation.error);
    //This will be used for checking other validations like length of pincode, format of date, etc
    if (!validation.success)
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    const enquiryDraft = yield enquiryDraft_1.EnquiryDraft.create(validation.data);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Draft created successfully', true, enquiryDraft);
}));
exports.updateEnquiryDraftStep1 = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const enquiryDraftStep1Data = req.body;
    const validation = enquiry_2.enquiryDraftStep1UpdateSchema.safeParse(enquiryDraftStep1Data);
    if (!validation.success)
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    const _a = validation.data, { id } = _a, newData = __rest(_a, ["id"]);
    const updatedDraft = yield enquiryDraft_1.EnquiryDraft.findByIdAndUpdate(id, { $set: newData }, { new: true, runValidators: true });
    if (!updatedDraft) {
        throw (0, http_errors_1.default)(404, 'Failed to update draft');
    }
    return (0, formatResponse_1.formatResponse)(res, 200, 'Draft updated successfully', true, updatedDraft);
}));
exports.createEnquiry = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = req.body;
    const validation = enquiry_2.enquiryStep1RequestSchema.safeParse(data);
    console.log(validation.error);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const { id } = data, enquiryData = __rest(data, ["id"]);
    console.log(enquiryData);
    //Create the enquiry
    let savedResult = yield enquiry_1.Enquiry.create(Object.assign({}, enquiryData));
    if (savedResult) {
        //Delete enquiry draft only if the save of enquiry is successful.
        if (id) {
            const deletedDraft = yield enquiryDraft_1.EnquiryDraft.findByIdAndDelete(id);
            if (deletedDraft) {
                throw (0, formatResponse_1.formatResponse)(res, 201, 'Draft deleted successfully', true);
            }
            //DA Check : There are 2 possibilities here, either draft deletion is unsuccessful or the draft doesn't exists only, so what should we do here? => isExists ka check lagana hai?
        }
        return (0, formatResponse_1.formatResponse)(res, 201, 'Enquiry created successfully', true, savedResult);
    }
    else {
        throw (0, http_errors_1.default)(404, 'Error occurred creating enquiry');
    }
}));
exports.updateEnquiryStep1ById = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validation = enquiry_2.enquiryStep1UpdateRequestSchema.safeParse(req.body);
    if (!validation.success) {
        console.log(validation.error);
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const _a = validation.data, { id } = _a, data = __rest(_a, ["id"]);
    const updatedData = yield enquiry_1.Enquiry.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
    if (!updatedData) {
        throw (0, http_errors_1.default)(404, 'Enquiry occurred in updating data');
    }
    return (0, formatResponse_1.formatResponse)(res, 200, 'Enquiry data updated successfully', true, updatedData);
}));
exports.createFeeDraft = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const feesDraftData = req.body;
    const validation = studentFees_1.feesDraftRequestSchema.safeParse(feesDraftData);
    console.log("Validation Error");
    console.log(validation.error);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0].message);
    }
    const enquiry = yield enquiry_1.Enquiry.findOne({
        _id: feesDraftData.enquiryId,
        applicationStatus: constants_1.ApplicationStatus.STEP_1
    }, {
        course: 1
    }).lean();
    if (!enquiry) {
        throw (0, http_errors_1.default)(400, 'Enquiry does not exist');
    }
    const otherFees = yield (0, courseAndOtherFees_controller_1.fetchOtherFees)();
    const semWiseFee = yield (0, courseAndOtherFees_controller_1.fetchCourseFeeByCourse)(enquiry.course.toString());
    const feeData = Object.assign(Object.assign({}, validation.data), { otherFees: ((_a = validation.data.otherFees) === null || _a === void 0 ? void 0 : _a.map(fee => {
            var _a, _b, _c;
            return (Object.assign(Object.assign({}, fee), { feeAmount: (_c = (_a = fee.feeAmount) !== null && _a !== void 0 ? _a : (_b = otherFees === null || otherFees === void 0 ? void 0 : otherFees.find(otherFee => otherFee.type === fee.type)) === null || _b === void 0 ? void 0 : _b.fee) !== null && _c !== void 0 ? _c : 0 }));
        })) || [], semWiseFees: ((_b = validation.data.semWiseFees) === null || _b === void 0 ? void 0 : _b.map((semFee, index) => {
            var _a, _b;
            return (Object.assign(Object.assign({}, semFee), { feeAmount: (_b = (_a = semFee.feeAmount) !== null && _a !== void 0 ? _a : semWiseFee === null || semWiseFee === void 0 ? void 0 : semWiseFee.fee[index]) !== null && _b !== void 0 ? _b : 0 }));
        })) || [] });
    const feesDraft = yield studentFeesDraft_1.StudentFeesDraftModel.create(feeData);
    yield enquiry_1.Enquiry.findByIdAndUpdate(feesDraftData.enquiryId, { $set: { studentFeeDraft: feesDraft._id } });
    return (0, formatResponse_1.formatResponse)(res, 201, 'Fees Draft created successfully', true, feesDraft);
}));
exports.updateFeeDraft = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let feesDraftData = req.body;
    let { id } = feesDraftData, feesDraftUpdateData = __rest(feesDraftData, ["id"]);
    const validation = studentFees_1.feesDraftUpdateSchema.safeParse(feesDraftUpdateData);
    console.log("Validation Error");
    console.log(validation.error);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0].message);
    }
    const updateData = Object.assign(Object.assign({}, validation.data), { otherFees: (_a = validation.data.otherFees) === null || _a === void 0 ? void 0 : _a.map(fee => {
            var _a;
            return (Object.assign(Object.assign({}, fee), { feeAmount: (_a = fee.feeAmount) !== null && _a !== void 0 ? _a : 0 }));
        }), semWiseFees: (_b = validation.data.semWiseFees) === null || _b === void 0 ? void 0 : _b.map(semFee => {
            var _a;
            return (Object.assign(Object.assign({}, semFee), { feeAmount: (_a = semFee.feeAmount) !== null && _a !== void 0 ? _a : 0 }));
        }) });
    const updatedDraft = yield studentFeesDraft_1.StudentFeesDraftModel.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
    if (!updatedDraft) {
        throw (0, http_errors_1.default)(404, 'Fees Draft not found');
    }
    return (0, formatResponse_1.formatResponse)(res, 200, 'Fees Draft updated successfully', true, updatedDraft);
}));
exports.createEnquiryStep2 = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const feesDraftData = req.body;
    const validation = studentFees_1.feesRequestSchema.safeParse(feesDraftData);
    console.log(validation.error);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const enquiry = yield enquiry_1.Enquiry.findOne({
        _id: feesDraftData.enquiryId,
        applicationStatus: constants_1.ApplicationStatus.STEP_1
    }, {
        course: 1, // Only return course field
        studentFeeDraft: 1
    }).lean();
    let feesDraft;
    if (enquiry) {
        const otherFees = yield (0, courseAndOtherFees_controller_1.fetchOtherFees)();
        const semWiseFee = yield (0, courseAndOtherFees_controller_1.fetchCourseFeeByCourse)((_a = enquiry === null || enquiry === void 0 ? void 0 : enquiry.course.toString()) !== null && _a !== void 0 ? _a : '');
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
        //This means that enquiry is existing
        feesDraft = yield studentFees_2.FeesDraftModel.create(feeData);
        yield enquiry_1.Enquiry.findByIdAndUpdate(feesDraftData.enquiryId, {
            $set: {
                studentFee: feesDraft._id,
            }
        });
        // console.log(enquiry);
        if (feesDraft) {
            if (enquiry === null || enquiry === void 0 ? void 0 : enquiry.studentFeeDraft) {
                const updatedStudentDraft = yield studentFeesDraft_1.StudentFeesDraftModel.findByIdAndDelete(enquiry.studentFeeDraft);
            }
        }
    }
    else {
        //Enquiry does not exist, we have to create enquiry first.
        //This will never be true as we are getting from UI so we will land into this call if and only if enquiry Id is existing.
        throw (0, http_errors_1.default)(400, 'Enquiry doesnot exist');
    }
    return (0, formatResponse_1.formatResponse)(res, 201, 'Fees Draft created successfully', true, feesDraft);
}));
exports.updateEnquiryStep2ById = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const feesDraftUpdateData = req.body;
    const feesDraft = yield updateFeeDetails([constants_1.ApplicationStatus.STEP_1, constants_1.ApplicationStatus.STEP_3, constants_1.ApplicationStatus.STEP_4], feesDraftUpdateData);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Fees Draft updated successfully', true, feesDraft);
}));
const updateFeeDetails = (applicationStatusList, feesDraftUpdateData, finalApplicationStatus) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const validation = studentFees_1.feesUpdateSchema.safeParse(feesDraftUpdateData);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const enquiry = yield enquiry_1.Enquiry.findOne({
        studentFee: feesDraftUpdateData.id,
        applicationStatus: { $nin: [...applicationStatusList] }
    }, {
        course: 1 // Only return course field
    }).lean();
    if (!enquiry) {
        throw (0, http_errors_1.default)(404, 'please contact finance team to change the information');
    }
    const otherFees = yield (0, courseAndOtherFees_controller_1.fetchOtherFees)();
    const semWiseFee = yield (0, courseAndOtherFees_controller_1.fetchCourseFeeByCourse)((_a = enquiry === null || enquiry === void 0 ? void 0 : enquiry.course.toString()) !== null && _a !== void 0 ? _a : '');
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
    const feesDraft = yield studentFees_2.FeesDraftModel.findByIdAndUpdate(feesDraftUpdateData.id, { $set: feeData }, { new: true, runValidators: true });
    if (!feesDraft) {
        throw (0, http_errors_1.default)(404, 'Failed to update Fees Draft');
    }
    if (finalApplicationStatus) {
        yield enquiry_1.Enquiry.updateOne({ studentFee: feesDraftUpdateData.id }, { applicationStatus: finalApplicationStatus }, { runValidators: true });
    }
    return feesDraft;
});
exports.updateEnquiryStep3ById = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validation = enquiry_2.enquiryStep3UpdateRequestSchema.safeParse(req.body);
    if (!validation.success) {
        console.log(validation.error.errors[0]);
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const _a = validation.data, { id } = _a, data = __rest(_a, ["id"]);
    const enquiry = yield enquiry_1.Enquiry.findOne({
        _id: id,
        applicationStatus: { $ne: constants_1.ApplicationStatus.STEP_1 }
    }, {
        applicationStatus: 1
    });
    if (!enquiry) {
        // is it can't happen that id was not exists so case which is possible is that ki student only did step1 and came to register [we are ignoring postman possibility here]
        throw (0, http_errors_1.default)(400, "Please complete step 2 first");
    }
    const updatedData = yield enquiry_1.Enquiry.findByIdAndUpdate(id, Object.assign({}, data), { new: true, runValidators: true });
    if (!updatedData) {
        throw (0, http_errors_1.default)(404, 'Enquiry not found');
    }
    return (0, formatResponse_1.formatResponse)(res, 200, 'Enquiry data updated successfully', true, updatedData);
}));
// DTODO: there are few documents which are IMP need to think that how will handle those => Make them mandate from the UI side.
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
exports.updateEnquiryStep4ById = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const feesDraftUpdateData = req.body;
    const feesDraft = yield updateFeeDetails([constants_1.ApplicationStatus.STEP_1, constants_1.ApplicationStatus.STEP_2], feesDraftUpdateData, constants_1.ApplicationStatus.STEP_4);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Fees Draft updated successfully', true, feesDraft);
}));
exports.getEnquiryData = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { search, applicationStatus } = req.body;
    if (!search) {
        search = "";
    }
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
}));
exports.getEnquiryById = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw (0, http_errors_1.default)(400, 'Invalid enquiry ID');
    }
    let enquiry = yield enquiry_1.Enquiry.findById(id).populate('studentFee');
    if (!enquiry) {
        const enquiryDraft = yield enquiryDraft_1.EnquiryDraft.findById(id);
        if (enquiryDraft) {
            return (0, formatResponse_1.formatResponse)(res, 200, 'Enquiry draft details', true, enquiryDraft);
        }
    }
    if (!enquiry.studentFee) {
        enquiry = yield enquiry_1.Enquiry.findById(id).populate('studentFeeDraft');
    }
    return (0, formatResponse_1.formatResponse)(res, 200, 'Enquiry details', true, enquiry);
}));
// DTODO: lets just take _id from the frontend => Resolved
exports.approveEnquiry = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.body;
    const validation = commonSchema_1.objectIdSchema.safeParse(id);
    if (!validation.success)
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    const enquiry = yield enquiry_1.Enquiry.findById(id);
    if (!enquiry)
        throw (0, http_errors_1.default)(404, 'Please create the enquiry first!');
    // For this enquiry Id, we will set the university ID, form no and the photo number. 
    const prefix = getPrefixForCourse(enquiry.course);
    // Update serial
    const serial = yield enquiryIdMetaDataSchema_1.EnquiryApplicationId.findOneAndUpdate({ prefix: prefix }, { $inc: { lastSerialNumber: 1 } }, { new: true, runValidators: true });
    const formNo = `${prefix}${serial.lastSerialNumber}`;
    const photoSerial = yield enquiryIdMetaDataSchema_1.EnquiryApplicationId.findOneAndUpdate({ prefix: constants_1.PHOTO }, { $inc: { lastSerialNumber: 1 } }, { new: true, runValidators: true });
    let universityId = generateUniversityId(enquiry.course, photoSerial.lastSerialNumber);
    const approvedById = (_a = req.data) === null || _a === void 0 ? void 0 : _a.id;
    if (approvedById) {
        let approvedEnquiry = yield enquiry_1.Enquiry.findByIdAndUpdate(id, {
            $set: { formNo: formNo, photoNo: photoSerial.lastSerialNumber, universityId: universityId, applicationStatus: constants_1.ApplicationStatus.STEP_4, approvedBy: approvedById }
        }, { runValidators: true });
        if (!approvedEnquiry) {
            throw (0, http_errors_1.default)(404, 'Failed to approve enquiry!');
        }
        else {
            return (0, formatResponse_1.formatResponse)(res, 200, 'Enquiry Approved Successfully', true);
        }
    }
    else {
        throw (0, http_errors_1.default)(404, 'Invalid user logged in!');
    }
}));
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
const getPrefixForCourse = (course) => {
    if (course === constants_1.Course.MBA)
        return constants_1.FormNoPrefixes.TIMS;
    if (course === constants_1.Course.LLB)
        return constants_1.FormNoPrefixes.TCL;
    return constants_1.FormNoPrefixes.TIHS;
};
