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
exports.fetchOtherFees = exports.fetchCourseFeeByCourse = exports.getOtherFees = exports.getCourseFeeByCourseName = exports.getFeesStructureById = exports.getAllFeesStructures = exports.updateFeesStructure = exports.createFeesStructure = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const courseAndOtherFees_model_1 = require("./courseAndOtherFees.model");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const courseMetadata_1 = require("../course/models/courseMetadata");
const formatResponse_1 = require("../utils/formatResponse");
const createFeesStructure = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const newDoc = yield courseAndOtherFees_model_1.CourseAndOtherFeesModel.create(req.body);
    res.status(201).json(newDoc);
});
exports.createFeesStructure = createFeesStructure;
const updateFeesStructure = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const updated = yield courseAndOtherFees_model_1.CourseAndOtherFeesModel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) {
        throw (0, http_errors_1.default)(404, 'Document not found');
    }
    res.json(updated);
});
exports.updateFeesStructure = updateFeesStructure;
const getAllFeesStructures = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const all = yield courseAndOtherFees_model_1.CourseAndOtherFeesModel.find();
    res.json(all);
});
exports.getAllFeesStructures = getAllFeesStructures;
const getFeesStructureById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const doc = yield courseAndOtherFees_model_1.CourseAndOtherFeesModel.findById(req.params.id);
    if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
    }
    res.json(doc);
});
exports.getFeesStructureById = getFeesStructureById;
exports.getCourseFeeByCourseName = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const courseName = req.params.courseName;
    const courseFee = yield (0, exports.fetchCourseFeeByCourse)(courseName);
    if (!courseFee)
        throw (0, http_errors_1.default)(404, "Fee not found for this course");
    return (0, formatResponse_1.formatResponse)(res, 200, "Other fees fetched successfully for this course", true, courseFee);
}));
const getOtherFees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const courseName = req.params.courseName;
    const otherFees = yield (0, exports.fetchOtherFees)(courseName);
    if (!otherFees)
        throw (0, http_errors_1.default)(404, "Other fees not found for this course");
    return (0, formatResponse_1.formatResponse)(res, 200, "Other fees fetched successfully for this course", true, otherFees);
});
exports.getOtherFees = getOtherFees;
const fetchCourseFeeByCourse = (courseName) => __awaiter(void 0, void 0, void 0, function* () {
    const record = yield courseMetadata_1.CourseMetaData.findOne({
        'courseName': courseName
    });
    if (!record)
        return null;
    const courseFee = record.fee.semWiseFee;
    // console.log("Course Fee : ", courseFee);
    return courseFee || null;
});
exports.fetchCourseFeeByCourse = fetchCourseFeeByCourse;
const fetchOtherFees = (courseName) => __awaiter(void 0, void 0, void 0, function* () {
    const record = yield courseMetadata_1.CourseMetaData.findOne({
        'courseName': courseName
    });
    if (!record)
        return null;
    // console.log("Record is : ", record);
    // console.log("Fees : ", record.fee);
    const yearlyFee = record.fee.yearlyFee || [];
    const oneTimeFee = record.fee.oneTime || [];
    const otherFees = [...yearlyFee, ...oneTimeFee];
    // console.log("Other fees : ", otherFees);
    return otherFees;
});
exports.fetchOtherFees = fetchOtherFees;
