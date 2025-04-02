"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.singleStudentDocumentUpdateSchema = exports.singleStudentDocumentRequestSchema = void 0;
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const commonSchema_1 = require("../../validators/commonSchema");
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
exports.singleStudentDocumentRequestSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(constants_1.DocumentType),
    dueBy: zod_1.z.date().optional(),
    fileUrl: zod_1.z.string(),
});
exports.singleStudentDocumentUpdateSchema = exports.singleStudentDocumentRequestSchema.extend({
    studentId: commonSchema_1.objectIdSchema,
    type: zod_1.z.nativeEnum(constants_1.DocumentType),
    documentBuffer: zod_1.z.object({
        buffer: zod_1.z.instanceof(Buffer),
        mimetype: zod_1.z.string(),
        size: zod_1.z.number()
            .positive()
            .max(5 * 1024 * 1024, { message: 'File size must be less than 5MB' }),
        originalname: zod_1.z.string(),
    }).refine((file) => ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'].includes(file.mimetype), { message: 'Invalid file type. Only PNG, JPG, JPEG, and PDF are allowed.' }).optional(),
    dueBy: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)).optional(),
}).omit({ fileUrl: true });
