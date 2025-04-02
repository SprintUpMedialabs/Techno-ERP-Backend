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
exports.searchCourse = exports.deleteCourse = exports.updateCourse = exports.createCourse = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importDefault(require("mongoose"));
const formatResponse_1 = require("../../utils/formatResponse");
const department_1 = require("../models/department");
const courseSchema_1 = require("../validators/courseSchema");
exports.createCourse = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const createCourseData = req.body;
    const validation = courseSchema_1.courseRequestSchema.safeParse(createCourseData);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const semesterArray = Array.from({ length: createCourseData.totalSemesters }, (_, i) => ({
        semesterNumber: i + 1,
        subjectDetails: []
    }));
    const newCourse = Object.assign(Object.assign({}, validation.data), { semester: semesterArray });
    const existingCourse = yield department_1.DepartmentModel.findOne({
        _id: validation.data.departmentId,
        "courses.courseCode": validation.data.courseCode
    });
    if (existingCourse) {
        throw (0, http_errors_1.default)(400, `Course with code ${validation.data.courseCode} already exists in this department.`);
    }
    const updatedDepartment = yield department_1.DepartmentModel.findOneAndUpdate({ _id: createCourseData.departmentId, "courses.courseCode": { $ne: newCourse.courseCode } }, { $push: { courses: newCourse } }, { new: true, runValidators: true });
    if (!updatedDepartment) {
        throw (0, http_errors_1.default)(400, "Course with this course code already exists.");
    }
    return (0, formatResponse_1.formatResponse)(res, 200, 'Course created successfully', true, updatedDepartment);
}));
exports.updateCourse = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const updateCourseData = req.body;
    const validation = courseSchema_1.updateCourseSchema.safeParse(updateCourseData);
    if (!validation.success)
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    const { courseId, courseName, courseCode, collegeName } = validation.data;
    const isDuplicateCourseCode = yield department_1.DepartmentModel.findOne({
        "courses.courseCode": courseCode,
        "courses._id": { $ne: courseId }
    });
    if (isDuplicateCourseCode) {
        throw (0, http_errors_1.default)(400, `Course with code ${courseCode} already exists in this department.`);
    }
    const updatedCourse = yield department_1.DepartmentModel.findOneAndUpdate({ "courses._id": courseId }, {
        $set: {
            "courses.$.courseName": courseName,
            "courses.$.courseCode": courseCode,
            "courses.$.collegeName": collegeName
        }
    }, { new: true, projection: { "courses": { $elemMatch: { _id: courseId } } }, runValidators: true });
    return (0, formatResponse_1.formatResponse)(res, 200, 'Course information updated successfully', true, updatedCourse);
}));
exports.deleteCourse = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { courseId } = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(courseId)) {
        throw (0, http_errors_1.default)(404, 'Not a valid course id');
    }
    const updatedDepartment = yield department_1.DepartmentModel.findOneAndUpdate({ "courses._id": courseId }, { $pull: { courses: { _id: courseId } } }, { new: true });
    return (0, formatResponse_1.formatResponse)(res, 200, "Course deleted successfully", true, updatedDepartment);
}));
exports.searchCourse = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { search } = req.body;
    if (!search) {
        search = "";
    }
    // Future DTODO: do we change this to just search based on courseCode?
    const matchedCourses = yield department_1.DepartmentModel.aggregate([
        { $unwind: "$courses" },
        {
            $match: {
                $or: [
                    { "courses.courseCode": { $regex: search, $options: "i" } },
                    { "courses.courseName": { $regex: search, $options: "i" } }
                ]
            }
        },
        {
            $project: {
                _id: 0,
                departmentId: "$_id",
                courseId: "$courses._id",
                courseCode: "$courses.courseCode",
                courseName: "$courses.courseName",
                academicYear: "$courses.academicYear",
                totalSemesters: "$courses.totalSemesters",
                semester: "$courses.semester"
            }
        }
    ]);
    if (matchedCourses.length === 0) {
        throw (0, http_errors_1.default)(404, "No matching courses found.");
    }
    return (0, formatResponse_1.formatResponse)(res, 200, "Courses found", true, matchedCourses);
}));
