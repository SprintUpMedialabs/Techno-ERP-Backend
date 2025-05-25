"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPayloadSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
exports.UserPayloadSchema = zod_1.z.object({
    id: zod_1.z.string(),
    roles: zod_1.z.array(zod_1.z.nativeEnum(constants_1.UserRoles)),
    universityId: zod_1.z.string().optional()
});
