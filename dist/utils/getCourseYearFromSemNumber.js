"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseYearFromSemNumber = void 0;
const constants_1 = require("../config/constants");
const CourseYear = ["", constants_1.CourseYears.First, constants_1.CourseYears.Second, constants_1.CourseYears.Third, constants_1.CourseYears.Fourth, constants_1.CourseYears.Fifth, constants_1.CourseYears.Sixth];
const getCourseYearFromSemNumber = (semesterNumber) => {
    console.log("Semester Number : ", semesterNumber);
    const courseYear = CourseYear[Math.ceil(semesterNumber / 2.0)];
    console.log("Course Year is : ", courseYear);
    return courseYear;
};
exports.getCourseYearFromSemNumber = getCourseYearFromSemNumber;
