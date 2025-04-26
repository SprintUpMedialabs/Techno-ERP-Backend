"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entranceExamDetailSchema = void 0;
const zod_1 = require("zod");
exports.entranceExamDetailSchema = zod_1.z.object({
    nameOfExamination: zod_1.z.string().optional(),
    rollNumber: zod_1.z.string().optional(),
    rank: zod_1.z.number().optional(),
    qualified: zod_1.z.boolean().optional()
});
