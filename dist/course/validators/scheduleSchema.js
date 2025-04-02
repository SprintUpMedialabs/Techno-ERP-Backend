"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleUpdateSchema = exports.scheduleRequestSchema = exports.scheduleSchema = void 0;
const zod_1 = require("zod");
const commonSchema_1 = require("../../validators/commonSchema");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
exports.scheduleSchema = zod_1.z.object({
    lectureNumber: zod_1.z.number().min(1, "Lecture number must be greater than 0"),
    topicName: zod_1.z.string().min(3, "Topic name should be at least 3 characters long"),
    description: zod_1.z.string().max(500, "Description should not exceed 500 characters").optional(),
    plannedDate: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)),
    dateOfLecture: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)),
    confirmation: zod_1.z.boolean(),
    remarks: zod_1.z.string().max(200, "Remarks should not exceed 200 characters").optional(),
});
exports.scheduleRequestSchema = exports.scheduleSchema.extend({
    subjectId: commonSchema_1.objectIdSchema
});
exports.scheduleUpdateSchema = exports.scheduleSchema.extend({
    scheduleId: commonSchema_1.objectIdSchema
});
