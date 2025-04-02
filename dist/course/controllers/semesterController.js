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
exports.createSemester = exports.deleteSemester = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const formatResponse_1 = require("../../utils/formatResponse");
const mongoose_1 = require("mongoose");
const department_1 = require("../models/department");
const semesterSchema_1 = require("../validators/semesterSchema");
// DTODO : On deleting semester, the total number of semesters in course should change. => DONE
exports.deleteSemester = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { courseId, semesterId } = req.body;
    if (!mongoose_1.Types.ObjectId.isValid(semesterId)) {
        throw (0, http_errors_1.default)(400, "Invalid Semester ID");
    }
    const updatedDepartment = yield department_1.DepartmentModel.findOneAndUpdate({ "courses._id": courseId }, {
        $pull: { "courses.$.semester": { _id: semesterId } },
        $inc: { "courses.$.totalSemesters": -1 }
    }, { new: true, projection: { "courses": { $elemMatch: { _id: courseId } } }, runValidators: true });
    console.log(updatedDepartment);
    if (!updatedDepartment || updatedDepartment.courses.length === 0) {
        throw (0, http_errors_1.default)(404, "Semester not deleted.");
    }
    return (0, formatResponse_1.formatResponse)(res, 200, "Semester deleted successfully", true, updatedDepartment);
}));
// DTODO: lets return only course rather than department.
exports.createSemester = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const createSemesterData = req.body;
    const validation = semesterSchema_1.semesterRequestSchema.safeParse(createSemesterData);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const { courseId, semesterNumber } = validation.data;
    const semesterData = {
        semesterNumber: semesterNumber,
        subjectDetails: []
    };
    // DTODO: lets use isExist  here.
    const existingCourse = yield department_1.DepartmentModel.findOne({
        "courses._id": courseId,
        "courses.semester.semesterNumber": semesterNumber
    });
    if (existingCourse) {
        throw (0, http_errors_1.default)(400, `Semester ${semesterNumber} already exists in this course, please update if required.`);
    }
    const updatedCourse = yield department_1.DepartmentModel.findOneAndUpdate({
        "courses._id": courseId,
    }, {
        $push: { "courses.$.semester": semesterData },
        $inc: { "courses.$.totalSemesters": 1 }
    }, { new: true, projection: { "courses": { $elemMatch: { _id: courseId } } }, runValidators: true });
    return (0, formatResponse_1.formatResponse)(res, 200, "Semester created successfully", true, updatedCourse);
}));
