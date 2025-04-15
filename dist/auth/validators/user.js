"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
exports.userSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    firstName: zod_1.z.string(),
    lastName: zod_1.z.string(),
    password: zod_1.z.string().optional(),
    roles: zod_1.z.array(zod_1.z.nativeEnum(constants_1.UserRoles)).default([constants_1.UserRoles.BASIC_USER])
});
