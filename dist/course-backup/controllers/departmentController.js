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
exports.updateDepartment = exports.createDepartment = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const formatResponse_1 = require("../../utils/formatResponse");
const departmentSchema_1 = require("../validators/departmentSchema");
const department_1 = require("../models/department");
exports.createDepartment = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { departmentName, hod } = req.body;
    const validation = departmentSchema_1.departmentSchema.safeParse({ departmentName, hod });
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const newDepartment = yield department_1.DepartmentModel.create(validation.data);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Department created successfully', true, newDepartment);
}));
exports.updateDepartment = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { departmentId, hod } = req.body;
    const validation = departmentSchema_1.departmentUpdateSchema.safeParse({ departmentId, hod });
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const updatedDepartment = yield department_1.DepartmentModel.findByIdAndUpdate(validation.data.departmentId, { $set: { hodName: validation.data.hod } }, { new: true, runValidators: true });
    return (0, formatResponse_1.formatResponse)(res, 200, 'Department updated successfully', true, updatedDepartment);
}));
