"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enquiryApplicationIdSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
exports.enquiryApplicationIdSchema = zod_1.z.object({
    prefix: zod_1.z.nativeEnum(constants_1.ApplicationIdPrefix),
    lastSerialNumber: zod_1.z.number().int().min(0),
});
