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
const logger_1 = __importDefault(require("../../config/logger"));
const http_errors_1 = __importDefault(require("http-errors"));
const commonSchema_1 = require("../../validators/commonSchema");
const constants_1 = require("../../config/constants");
const dropdownSchema_1 = require("../validators/dropdownSchema");
const formatName_1 = require("../../utils/formatName");
exports.userProfile = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedData = req.data;
    if (!decodedData) {
        res.status(404).json({ message: "Profile couldn't be displayed." });
        return;
    }
    const { id, roles } = decodedData;
    // console.log('User ID:', id, 'Roles:', roles);
    try {
        const user = yield user_1.User.findById(id);
        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }
        res.status(200).json({
            message: 'User profile retrieved successfully.',
            userData: {
                id: user._id,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                roles: user.roles
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error in userProfile:', error);
        res.status(500).json({ message: 'An unexpected error occurred.' });
    }
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
    res.status(200).json({ users: formattedUsers });
}));
exports.fetchDropdownsBasedOnPage = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { moduleName } = req.query;
    const id = (_a = req.data) === null || _a === void 0 ? void 0 : _a.id;
    const roles = (_b = req.data) === null || _b === void 0 ? void 0 : _b.roles;
    const validation = dropdownSchema_1.dropdownSchema.safeParse({ roles, moduleName });
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, "Invalid role or module name");
    }
    let users;
    if (moduleName === constants_1.ModuleNames.MARKETING) {
        // If the user is ADMIN or LEAD_MARKETING (and not only marketing employee)
        if (roles.includes(constants_1.UserRoles.ADMIN) || roles.includes(constants_1.UserRoles.LEAD_MARKETING)) {
            users = yield user_1.User.find({ roles: constants_1.UserRoles.EMPLOYEE_MARKETING });
        }
        // If the user is only a MARKETING_EMPLOYEE
        else if (roles.includes(constants_1.UserRoles.EMPLOYEE_MARKETING)) {
            users = yield user_1.User.findOne({ _id: id });
            if (!users) {
                throw (0, http_errors_1.default)(404, "User not found");
            }
            users = [users];
        }
        if (users) {
            const formattedUsers = users.map((user) => ({
                _id: user._id,
                name: (0, formatName_1.formatName)(user.firstName, user.lastName),
                email: user.email
            }));
            res.status(200).json(formattedUsers);
        }
    }
    //throw createHttpError(400, "Invalid module name");
}));
