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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDepartmentMetaData = exports.createDepartmentMetaData = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const departmentSchema_1 = require("../validators/departmentSchema");
const http_errors_1 = __importDefault(require("http-errors"));
const department_1 = require("../models/department");
const formatResponse_1 = require("../../utils/formatResponse");
exports.createDepartmentMetaData = (0, express_async_handler_1.default)((req, res) => {
    const departmentMetaData = req.body;
    const validation = departmentSchema_1.departmentMetaDataSchema.safeParse(departmentMetaData);
    if (!validation.success)
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    // DTODO : Do we want to keep check here : Check is there any existing course with incoming course name, set ending year there and then create new one.
    const department = department_1.DepartmentMetaData.create(validation.data);
    if (!department) {
        throw (0, http_errors_1.default)(500, 'Error occurred while saving the department meta data');
    }
    return (0, formatResponse_1.formatResponse)(res, 201, 'Department Meta Data added successfully', true, department);
});
exports.updateDepartmentMetaData = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const departmentMetaData = req.body;
    const validation = departmentSchema_1.departmentMetaDataUpdateSchema.safeParse(departmentMetaData);
    if (!validation.success)
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    const _a = validation.data, { departmentMetaDataID } = _a, latestData = __rest(_a, ["departmentMetaDataID"]);
    const updatedDepartmentMetaData = yield department_1.DepartmentMetaData.findByIdAndUpdate(departmentMetaDataID, { $set: latestData }, { new: true, runValidators: true });
    if (!updatedDepartmentMetaData) {
        throw (0, http_errors_1.default)(500, 'Error occurred while updating the department meta data');
    }
    return (0, formatResponse_1.formatResponse)(res, 201, 'Department Meta Data updated successfully', true, updatedDepartmentMetaData);
}));
