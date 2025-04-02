"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enquiryStatusUpdateSchema = void 0;
const zod_1 = require("zod");
const commonSchema_1 = require("../../validators/commonSchema");
const constants_1 = require("../../config/constants");
exports.enquiryStatusUpdateSchema = zod_1.z.object({
    id: commonSchema_1.objectIdSchema,
    newStatus: zod_1.z.nativeEnum(constants_1.ApplicationStatus)
});
