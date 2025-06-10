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
exports.updateEnquiryStep1ById = exports.createEnquiry = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../../config/constants");
const functionLevelLogging_1 = require("../../config/functionLevelLogging");
const dropDownMetadataController_1 = require("../../utilityModules/dropdown/dropDownMetadataController");
const formatResponse_1 = require("../../utils/formatResponse");
const enquiry_1 = require("../models/enquiry");
const enquiryDraft_1 = require("../models/enquiryDraft");
const enquiry_2 = require("../validators/enquiry");
exports.createEnquiry = (0, express_async_handler_1.default)((0, functionLevelLogging_1.functionLevelLogger)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const data = req.body;
    const { _id: id } = data, enquiryData = __rest(data, ["_id"]);
    const validation = enquiry_2.enquiryStep1RequestSchema.safeParse(enquiryData);
    console.log("Validation error : ", validation.error);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const admittedThrough = enquiryData.course === constants_1.Course.BED ? constants_1.AdmittedThrough.COUNSELLING : constants_1.AdmittedThrough.DIRECT;
    const enquiry = yield enquiry_1.Enquiry.findById(id);
    if (enquiry) {
        throw (0, http_errors_1.default)(400, 'Enquiry already exists');
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        //Delete enquiry draft only if saving enquiry is successful.
        if (id) {
            const deletedDraft = yield enquiryDraft_1.EnquiryDraft.findByIdAndDelete(id, { session });
            if (!deletedDraft) {
                throw (0, formatResponse_1.formatResponse)(res, 404, 'Error occurred while deleting the enquiry draft', true);
            }
        }
        const savedResult = yield enquiry_1.Enquiry.create([Object.assign(Object.assign({}, enquiryData), { _id: id, admittedThrough, applicationStatus: constants_1.ApplicationStatus.STEP_2 })], { session });
        const enquiry = savedResult[0];
        (0, dropDownMetadataController_1.updateOnlyOneValueInDropDown)(constants_1.DropDownType.DISTRICT, (_a = enquiry.address) === null || _a === void 0 ? void 0 : _a.district);
        yield session.commitTransaction();
        return (0, formatResponse_1.formatResponse)(res, 201, 'Enquiry created successfully', true, enquiry);
    }
    catch (error) {
        yield (session === null || session === void 0 ? void 0 : session.abortTransaction());
        session === null || session === void 0 ? void 0 : session.endSession();
        throw (0, http_errors_1.default)(error);
    }
})));
exports.updateEnquiryStep1ById = (0, express_async_handler_1.default)((0, functionLevelLogging_1.functionLevelLogger)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // currently not in use
    // const validation = enquiryStep1UpdateRequestSchema.safeParse(req.body);
    // if (!validation.success) {
    //   throw createHttpError(400, validation.error.errors[0]);
    // }
    // const { id, ...data } = validation.data;
    // await checkIfStudentAdmitted(id);
    // const updatedData = await Enquiry.findByIdAndUpdate(
    //   { _id: id },
    //   { $set: data },
    //   { new: true, runValidators: true }
    // );
    // return formatResponse(res, 200, 'Enquiry data updated successfully', true, updatedData);
})));
