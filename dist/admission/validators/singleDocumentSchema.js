"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.singleDocumentSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
const commonSchema_1 = require("../../validators/commonSchema");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
exports.singleDocumentSchema = zod_1.z.object({
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
    fileUrl: zod_1.z.string().optional(),
});
