"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchDropdownsBasedOnPage = exports.getUserByRole = exports.userProfile = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const user_1 = require("../models/user");
const http_errors_1 = __importDefault(require("http-errors"));
const commonSchema_1 = require("../../validators/commonSchema");
const constants_1 = require("../../config/constants");
const formatName_1 = require("../../utils/formatName");
const formatResponse_1 = require("../../utils/formatResponse");
exports.userProfile = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedData = req.data;
    if (!decodedData) {
        throw (0, http_errors_1.default)(404, 'Profile could not be fetched');
    }
    const { id } = decodedData;
    // console.log("Decoded data is : ", decodedData)
    // console.log("ID is : ", id);
    const user = yield user_1.User.findById(id);
    console.log("User is : ", user);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Profile retrieved successfully', true, {
        userData: {
            id: user === null || user === void 0 ? void 0 : user._id,
            name: `${user === null || user === void 0 ? void 0 : user.firstName} ${user === null || user === void 0 ? void 0 : user.lastName}`,
            email: user === null || user === void 0 ? void 0 : user.email,
            roles: user === null || user === void 0 ? void 0 : user.roles
        }
    });
}));
exports.getUserByRole = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { role } = req.query;
    // Validate role using Zod
    const parsedRole = commonSchema_1.roleSchema.safeParse(role);
    if (!parsedRole.success) {
        throw (0, http_errors_1.default)(400, 'Invalid role provided');
    }
    // Fetch users and project only required fields
    const users = yield user_1.User.find({ roles: parsedRole.data }).select("_id firstName lastName email");
    // Transform the response to include only required fields
    const formattedUsers = users.map(user => ({
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
    }));
    return (0, formatResponse_1.formatResponse)(res, 200, 'Fetching successful', true, formattedUsers);
}));
exports.fetchDropdownsBasedOnPage = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { role } = req.query;
    if (Object.values(constants_1.UserRoles).includes(role)) {
        const users = yield user_1.User.find({ roles: role });
        const formattedUsers = users.map((user) => {
            var _a, _b;
            return ({
                _id: user === null || user === void 0 ? void 0 : user._id,
                name: (0, formatName_1.formatName)((_a = user === null || user === void 0 ? void 0 : user.firstName) !== null && _a !== void 0 ? _a : '', (_b = user === null || user === void 0 ? void 0 : user.lastName) !== null && _b !== void 0 ? _b : ''),
                email: user === null || user === void 0 ? void 0 : user.email
            });
        });
        return (0, formatResponse_1.formatResponse)(res, 200, 'Fetching successful', true, formattedUsers);
    }
    else {
        throw (0, http_errors_1.default)(400, "Invalid role");
    }
    // const { moduleName } = req.query;
    // const id = req.data?.id;
    // const roles = req.data?.roles!;
    // const validation = dropdownSchema.safeParse({ roles, moduleName });
    // if (!validation.success) {
    //   throw createHttpError(400, "Invalid role or module name");
    // }
    // let users;
    // if (moduleName === ModuleNames.MARKETING) {
    //   // If the user is ADMIN or LEAD_MARKETING (and not only marketing employee)
    //   if (roles.includes(UserRoles.ADMIN) || roles.includes(UserRoles.LEAD_MARKETING)) {
    //     users = await User.find({ roles: UserRoles.EMPLOYEE_MARKETING });
    //   }
    //   // If the user is only a MARKETING_EMPLOYEE
    //   else if (roles.includes(UserRoles.EMPLOYEE_MARKETING)) {
    //     users = await User.findOne({ _id: id });
    //     users = [users];
    //   }
    //   if (users) {
    //     const formattedUsers = users.map((user) => ({
    //       _id: user?._id,
    //       name: formatName(user?.firstName ?? '', user?.lastName ?? ''),
    //       email: user?.email
    //     }));
    //     return formatResponse(res, 200, 'Fetching successful', true, formattedUsers)
    //   }
    // } else if (moduleName === ModuleNames.ADMISSION) {
    //   if (roles.includes(UserRoles.COUNSELOR)) {
    //     users = await User.findOne({ _id: id });
    //     users = [users];
    //   }
    //   if (users) {
    //     const formattedUsers = users.map((user) => ({
    //       _id: user?._id,
    //       name: formatName(user?.firstName ?? '', user?.lastName ?? ''),
    //       email: user?.email
    //     }));
    //     return formatResponse(res, 200, 'Fetching successful', true, formattedUsers)
    //   }
    // }
    //throw createHttpError(400, "Invalid module name");
}));
