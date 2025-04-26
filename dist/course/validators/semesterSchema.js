"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.semesterSchema = void 0;
const zod_1 = require("zod");
const subjectSchema_1 = require("./subjectSchema");
exports.semesterSchema = zod_1.z.object({
    semesterNumber: zod_1.z.number().nonnegative("Semester Number should be a valid non negative integer"),
    academicYear: zod_1.z.string().regex(/^\d{4}-\d{4}$/, "Academic year must be in the format YYYY-YYYY"),
    subjects: zod_1.z.array(subjectSchema_1.subjectSchema),
});
