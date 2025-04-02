"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCourseSchema = exports.updateCourseSchema = exports.courseRequestSchema = exports.courseSchema = void 0;
const zod_1 = require("zod");
const commonSchema_1 = require("../../validators/commonSchema");
exports.courseSchema = zod_1.z.object({
    academicYear: zod_1.z.string().regex(/^\d{4}-\d{4}$/, "Invalid academic year format (YYYY-YYYY)"),
    // DTODO: lets use string here[also create api to get courses]
    // Future DTODO: in enquire request body will change courseCode type string to _id
    courseCode: zod_1.z.string().min(3, "Course Code is required"),
    courseName: zod_1.z.string().min(3, "Course Name is required"),
    collegeName: zod_1.z.string().min(3).max(100, "College name should be between 3 and 100 characters"),
    totalSemesters: zod_1.z.number().min(1, 'Please enter a valid value for total number of semesters')
});
exports.courseRequestSchema = exports.courseSchema.extend({
    departmentId: commonSchema_1.objectIdSchema //This we are taking as course will be created inside department
});
exports.updateCourseSchema = exports.courseSchema.omit({
    totalSemesters: true,
    academicYear: true,
}).extend({ courseId: commonSchema_1.objectIdSchema });
exports.deleteCourseSchema = zod_1.z.object({
    courseId: commonSchema_1.objectIdSchema,
    departmentId: commonSchema_1.objectIdSchema
});
