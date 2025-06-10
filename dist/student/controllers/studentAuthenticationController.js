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
exports.studentLogout = exports.studentLogin = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const auth_1 = require("../validators/auth/auth");
const http_errors_1 = __importDefault(require("http-errors"));
const student_1 = require("../models/student");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const jwtHelper_1 = require("../../utils/jwtHelper");
const formatResponse_1 = require("../../utils/formatResponse");
const constants_1 = require("../../config/constants");
exports.studentLogin = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = req.body;
    const validation = auth_1.loginRequestSchema.safeParse(data);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const student = yield student_1.Student.findOne({ 'studentInfo.universityId': validation.data.universityId });
    if (!student) {
        throw (0, http_errors_1.default)(404, 'Student not found. Please reverify your admission.');
    }
    const expectedPassword = (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(student.studentInfo.dateOfBirth);
    if (validation.data.password !== expectedPassword) {
        throw (0, http_errors_1.default)(400, 'Invalid password.');
    }
    const payload = {
        id: student._id,
        name: student.studentInfo.studentName,
        universityId: student.studentInfo.universityId,
        roles: [constants_1.UserRoles.STUDENT]
    };
    const token = jwtHelper_1.studentJwtHelper.createToken(payload, { expiresIn: '15d' });
    const options = {
        maxAge: 15 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    };
    res.cookie('token', token, options);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Logged in successfully', true, {
        token: token,
        roles: [constants_1.UserRoles.STUDENT],
        userData: {
            name: student.studentInfo.studentName,
            universityId: student.studentInfo.universityId
        }
    });
}));
const studentLogout = (req, res) => {
    res.cookie('token', '', {
        maxAge: 0,
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    });
    return (0, formatResponse_1.formatResponse)(res, 200, 'Logged out successfully', true);
};
exports.studentLogout = studentLogout;
