"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentFilterSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
exports.studentFilterSchema = zod_1.z.object({
    course: zod_1.z.nativeEnum(constants_1.Course).optional(),
    semester: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional()
});
