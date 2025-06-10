"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.physicalDocumentNoteSchema = exports.updateStudentPhysicalDocumentRequestSchema = exports.physicalDocumentNoteRequestSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const commonSchema_1 = require("../../validators/commonSchema");
exports.physicalDocumentNoteRequestSchema = zod_1.z.object({
    type: zod_1.z.string(),
    status: zod_1.z.nativeEnum(constants_1.PhysicalDocumentNoteStatus),
    dueBy: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)).optional(),
});
exports.updateStudentPhysicalDocumentRequestSchema = exports.physicalDocumentNoteRequestSchema.extend({ id: commonSchema_1.objectIdSchema }).strict();
exports.physicalDocumentNoteSchema = zod_1.z.object({
    type: zod_1.z.string(),
    status: zod_1.z.nativeEnum(constants_1.PhysicalDocumentNoteStatus),
    dueBy: zod_1.z.date().optional(),
});
