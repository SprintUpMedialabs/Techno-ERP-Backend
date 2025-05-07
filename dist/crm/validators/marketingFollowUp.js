"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketingFollowUpSchema = void 0;
const zod_1 = require("zod");
const commonSchema_1 = require("../../validators/commonSchema");
const constants_1 = require("../../config/constants");
exports.marketingFollowUpSchema = zod_1.z.object({
    currentLoggedInUser: commonSchema_1.objectIdSchema,
    leadId: commonSchema_1.objectIdSchema,
    action: zod_1.z.nativeEnum(constants_1.Actions)
});
