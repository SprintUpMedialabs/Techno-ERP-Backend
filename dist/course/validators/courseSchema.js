"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseSchema = void 0;
const zod_1 = require("zod");
const semesterSchema_1 = require("./semesterSchema");
const commonSchema_1 = require("../../validators/commonSchema");
exports.courseSchema = zod_1.z.object({
    courseName: zod_1.z.string({ required_error: "Course Name is required" }).nonempty("Course Name is required."),
    courseCode: zod_1.z.string({ required_error: "Course Code is required" }).nonempty("Course Code is required."),
    collegeName: zod_1.z.string({ required_error: "College Name is required" }).nonempty("College Name is required."),
    departmentMetaDataId: commonSchema_1.objectIdSchema,
    startingYear: zod_1.z.number()
        .min(1000, "Starting year must be a 4-digit year")
        .max(9999, "Starting year must be a 4-digit year"),
    totalSemesters: zod_1.z.number(),
    semester: zod_1.z.array(semesterSchema_1.semesterSchema).optional(),
});
