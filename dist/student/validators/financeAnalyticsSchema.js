"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceAnalyticsSchema = exports.courseWiseSchema = exports.courseYearDetailSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
exports.courseYearDetailSchema = zod_1.z.object({
    courseYear: zod_1.z.nativeEnum(constants_1.CourseYears),
    totalExpectedRevenue: zod_1.z.number().nonnegative().default(0),
    totalCollection: zod_1.z.number().nonnegative().default(0),
    totalStudents: zod_1.z.number().nonnegative().default(0)
});
exports.courseWiseSchema = zod_1.z.object({
    courseCode: zod_1.z.string(),
    departmentName: zod_1.z.string(),
    details: zod_1.z.array(exports.courseYearDetailSchema),
    totalExpectedRevenue: zod_1.z.number().nonnegative().default(0),
    totalCollection: zod_1.z.number().nonnegative().default(0),
    totalStudents: zod_1.z.number().nonnegative().default(0)
});
exports.FinanceAnalyticsSchema = zod_1.z.object({
    date: zod_1.z.date(),
    academicYear: zod_1.z.string(),
    totalExpectedRevenue: zod_1.z.number().nonnegative().default(0),
    totalCollection: zod_1.z.number().nonnegative().default(0),
    courseWise: zod_1.z.array(exports.courseWiseSchema),
    totalStudents: zod_1.z.number().nonnegative().default(0)
});
