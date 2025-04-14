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
exports.searchCourses = exports.createCourse = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const courseSchema_1 = require("../validators/courseSchema");
const http_errors_1 = __importDefault(require("http-errors"));
const getAcaYrFromStartYrSemNum_1 = require("../utils/getAcaYrFromStartYrSemNum");
const course_1 = require("../models/course");
const formatResponse_1 = require("../../utils/formatResponse");
exports.createCourse = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const courseData = req.body;
    const validation = courseSchema_1.courseSchema.safeParse(courseData);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const semester = Array.from({ length: courseData.totalSemesters }, (_, index) => ({
        semesterNumber: index + 1,
        academicYear: (0, getAcaYrFromStartYrSemNum_1.getAcaYrFromStartYrSemNum)(courseData.startingYear, index),
        subjects: [],
    }));
    const course = yield course_1.Course.create(Object.assign(Object.assign({}, courseData), { semester: semester }));
    if (!course)
        throw (0, http_errors_1.default)(500, 'Error occurred creating course');
    return (0, formatResponse_1.formatResponse)(res, 201, 'Course created successfully', true, course);
}));
const searchCourses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //DTODO : Baaki che aa vadu, will do after discussion with DA 
});
exports.searchCourses = searchCourses;
