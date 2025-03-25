"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentFilterSchema = void 0;
const zod_1 = require("zod");
exports.studentFilterSchema = zod_1.z.object({
    course: zod_1.z.string().optional(),
    semester: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional()
});
