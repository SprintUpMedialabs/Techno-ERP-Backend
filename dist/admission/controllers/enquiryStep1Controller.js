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
const constants_1 = require("../../config/constants");
const functionLevelLogging_1 = require("../../config/functionLevelLogging");
const formatResponse_1 = require("../../utils/formatResponse");
const enquiry_1 = require("../models/enquiry");
const enquiryDraft_1 = require("../models/enquiryDraft");
const enquiry_2 = require("../validators/enquiry");
const checkIfStudentAdmitted_1 = require("../helpers/checkIfStudentAdmitted");
const dropDownMetadataController_1 = require("../../utilityModules/dropdown/dropDownMetadataController");
exports.createEnquiry = (0, express_async_handler_1.default)((0, functionLevelLogging_1.functionLevelLogger)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const data = req.body;
    const validation = enquiry_2.enquiryStep1RequestSchema.safeParse(data);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const { id } = data, enquiryData = __rest(data, ["id"]);
    const admittedThrough = enquiryData.course === constants_1.Course.BED ? constants_1.AdmittedThrough.COUNSELLING : constants_1.AdmittedThrough.DIRECT;
    let savedResult = yield enquiry_1.Enquiry.create(Object.assign(Object.assign({}, enquiryData), { admittedThrough }));
    if (savedResult) {
        //Delete enquiry draft only if saving enquiry is successful.
        if (id) {
            const deletedDraft = yield enquiryDraft_1.EnquiryDraft.findByIdAndDelete(id);
            if (!deletedDraft) {
                throw (0, formatResponse_1.formatResponse)(res, 494, 'Error occurred while deleting the enquiry draft', true);
            }
        }
        (0, dropDownMetadataController_1.updateOnlyOneValueInDropDown)(constants_1.DropDownType.FIX_CITY, (_a = savedResult === null || savedResult === void 0 ? void 0 : savedResult.address) === null || _a === void 0 ? void 0 : _a.district);
        return (0, formatResponse_1.formatResponse)(res, 201, 'Enquiry created successfully', true, savedResult);
    }
    else {
        throw (0, http_errors_1.default)(404, 'Error occurred creating enquiry');
    }
})));
exports.updateEnquiryStep1ById = (0, express_async_handler_1.default)((0, functionLevelLogging_1.functionLevelLogger)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validation = enquiry_2.enquiryStep1UpdateRequestSchema.safeParse(req.body);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const _a = validation.data, { id } = _a, data = __rest(_a, ["id"]);
    yield (0, checkIfStudentAdmitted_1.checkIfStudentAdmitted)(id);
    const updatedData = yield enquiry_1.Enquiry.findByIdAndUpdate({ _id: id }, { $set: data }, { new: true, runValidators: true });
    return (0, formatResponse_1.formatResponse)(res, 200, 'Enquiry data updated successfully', true, updatedData);
})));
