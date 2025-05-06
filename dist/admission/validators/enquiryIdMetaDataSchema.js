"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enquiryIdMetaDataSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
exports.enquiryIdMetaDataSchema = zod_1.z.object({
    prefix: zod_1.z.nativeEnum(constants_1.FormNoPrefixes),
    lastSerialNumber: zod_1.z.number().int().min(0),
});
