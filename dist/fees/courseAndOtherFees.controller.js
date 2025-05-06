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
    if (!courseFee) {
        throw (0, http_errors_1.default)(404, 'Course fee not found');
    }
    res.status(200).json(courseFee);
}));
const getOtherFees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const otherFees = yield (0, exports.fetchOtherFees)();
    res.status(200).json(otherFees);
});
exports.getOtherFees = getOtherFees;
// ✅ Reusable function
const fetchCourseFeeByCourse = (courseName) => __awaiter(void 0, void 0, void 0, function* () {
    const record = yield courseAndOtherFees_model_1.CourseAndOtherFeesModel.findOne({
        'courseFees.course': courseName
    });
    if (!record)
        return null;
    const courseFee = record.courseFees.find(c => c.course === courseName);
    return courseFee || null;
});
exports.fetchCourseFeeByCourse = fetchCourseFeeByCourse;
const fetchOtherFees = () => __awaiter(void 0, void 0, void 0, function* () {
    const record = yield courseAndOtherFees_model_1.CourseAndOtherFeesModel.findOne();
    return (record === null || record === void 0 ? void 0 : record.otherFees) || [];
});
exports.fetchOtherFees = fetchOtherFees;
