"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.singleDocumentSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
const commonSchema_1 = require("../../validators/commonSchema");
exports.singleDocumentSchema = zod_1.z.object({
    enquiryId: commonSchema_1.objectIdSchema,
    type: zod_1.z.nativeEnum(constants_1.DocumentType),
    documentBuffer: zod_1.z.object({
        buffer: zod_1.z.instanceof(Buffer),
        mimetype: zod_1.z.string(),
        size: zod_1.z.number()
            .positive()
            .max(5 * 1024 * 1024, { message: 'File size must be less than 5MB' }),
        originalname: zod_1.z.string(),
    }).refine((file) => ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'].includes(file.mimetype), { message: 'Invalid file type. Only PNG, JPG, JPEG, and PDF are allowed.' })
});
