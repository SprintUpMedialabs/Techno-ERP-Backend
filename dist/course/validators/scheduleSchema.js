"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPracticalPlanSchema = exports.createLecturePlanSchema = exports.scheduleSchema = exports.practicalPlanSchema = exports.lecturePlanSchema = exports.baseLectureSchema = void 0;
const zod_1 = require("zod");
const commonSchema_1 = require("../../validators/commonSchema");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const constants_1 = require("../../config/constants");
exports.baseLectureSchema = zod_1.z.object({
    unit: zod_1.z.number().nonnegative({ message: "Unit Number is required " }),
    lectureNumber: zod_1.z.number().nonnegative({ message: "Lecture Number is required " }),
    topicName: zod_1.z.number(),
    instructor: commonSchema_1.objectIdSchema,
    plannedDate: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)),
    actualDate: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)).optional(),
    classStrength: zod_1.z.number().optional(),
    attendance: zod_1.z.number().optional(),
    absent: zod_1.z.number().optional(),
    confirmation: zod_1.z.nativeEnum(constants_1.LectureConfirmation).default(constants_1.LectureConfirmation.TO_BE_DONE),
    remarks: zod_1.z.string().optional(),
    documents: zod_1.z.array(zod_1.z.string().url()).optional()
});
exports.lecturePlanSchema = exports.baseLectureSchema.superRefine(({ attendance, classStrength }, ctx) => {
    if (attendance !== undefined && classStrength !== undefined && attendance > classStrength) {
        ctx.addIssue({
            path: ["attendance"],
            message: "Attendance cannot exceed class strength",
            code: zod_1.z.ZodIssueCode.custom,
        });
    }
});
exports.practicalPlanSchema = exports.lecturePlanSchema;
exports.scheduleSchema = zod_1.z.object({
    lecturePlan: zod_1.z.array(exports.lecturePlanSchema),
    practicalPlan: zod_1.z.array(exports.practicalPlanSchema),
    additionalResources: zod_1.z.array(zod_1.z.string().url()).optional()
});
exports.createLecturePlanSchema = exports.baseLectureSchema.extend({
    courseId: commonSchema_1.objectIdSchema,
    semesterId: commonSchema_1.objectIdSchema,
    subjectId: commonSchema_1.objectIdSchema,
    instructorId: commonSchema_1.objectIdSchema
});
exports.createPracticalPlanSchema = exports.createLecturePlanSchema;
