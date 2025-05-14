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
exports.getHODInformationUsingDepartmentID = exports.fetchInstructors = exports.getDepartmentMetaData = exports.updateDepartmentMetaData = exports.createDepartmentMetaData = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const departmentSchema_1 = require("../validators/departmentSchema");
const http_errors_1 = __importDefault(require("http-errors"));
const department_1 = require("../models/department");
const formatResponse_1 = require("../../utils/formatResponse");
const user_1 = require("../../auth/models/user");
exports.createDepartmentMetaData = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const departmentMetaData = req.body;
    const validation = departmentSchema_1.departmentMetaDataSchema.safeParse(departmentMetaData);
    const existingDepartment = yield department_1.DepartmentMetaData.findOne({ departmentName: (_a = validation.data) === null || _a === void 0 ? void 0 : _a.departmentName });
    if (!validation.success)
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    let department;
    if (existingDepartment) {
        department = yield department_1.DepartmentMetaData.findByIdAndUpdate(existingDepartment._id, validation.data, { new: true, runValidators: true });
    }
    else {
        department = yield department_1.DepartmentMetaData.create(validation.data);
    }
    return (0, formatResponse_1.formatResponse)(res, 201, 'Department Meta Data added successfully', true, department);
}));
exports.updateDepartmentMetaData = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const departmentMetaData = req.body;
    const validation = departmentSchema_1.departmentMetaDataUpdateSchema.safeParse(departmentMetaData);
    if (!validation.success)
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    const _a = validation.data, { departmentMetaDataID } = _a, latestData = __rest(_a, ["departmentMetaDataID"]);
    const updatedDepartmentMetaData = yield department_1.DepartmentMetaData.findByIdAndUpdate(departmentMetaDataID, { $set: latestData }, { new: true, runValidators: true });
    if (!updatedDepartmentMetaData) {
        throw (0, http_errors_1.default)(404, 'Department Meta Data not found');
    }
    return (0, formatResponse_1.formatResponse)(res, 200, 'Department Meta Data updated successfully', true, updatedDepartmentMetaData);
}));
exports.getDepartmentMetaData = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const departments = yield department_1.DepartmentMetaData.find();
    const formattedDepartments = departments.map(dept => {
        const _a = dept.toObject(), { _id } = _a, deptInfo = __rest(_a, ["_id"]);
        return Object.assign({ departmentMetaDataId: _id }, deptInfo);
    });
    return (0, formatResponse_1.formatResponse)(res, 200, 'Department metadata fetched successfully', true, formattedDepartments);
}));
exports.fetchInstructors = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { departmentName } = req.body;
    const department = yield department_1.DepartmentMetaData.findOne({ departmentName });
    if (!department) {
        return res.status(404).json({ message: 'Department not found' });
    }
    const instructorIds = department.instructors;
    const instructors = yield Promise.all(instructorIds.map((instructorId) => __awaiter(void 0, void 0, void 0, function* () {
        const instructor = yield user_1.User.findById(instructorId).select('_id firstName lastName email');
        if (!instructor)
            return null;
        return {
            _id: instructor._id,
            instructorId: instructor._id,
            name: `${instructor.firstName} ${instructor.lastName}`,
            email: instructor.email
        };
    })));
    const filteredInstructors = instructors.filter((instructor) => instructor !== null);
    console.log("Filtered Instructors are : ", filteredInstructors);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Instructors fetched successfully', true, filteredInstructors);
}));
const getHODInformationUsingDepartmentID = (departmentMetaDataID) => __awaiter(void 0, void 0, void 0, function* () {
    const department = yield department_1.DepartmentMetaData.findById(departmentMetaDataID);
    const hodInfo = yield user_1.User.findById(department === null || department === void 0 ? void 0 : department.departmentHODId);
    return {
        departmentName: department === null || department === void 0 ? void 0 : department.departmentName,
        departmentHODName: hodInfo.firstName + " " + hodInfo.lastName,
        departmentHODEmail: hodInfo.email
    };
});
exports.getHODInformationUsingDepartmentID = getHODInformationUsingDepartmentID;
