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
exports.deleteSchedule = exports.updateSchedule = exports.createSchedule = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = require("mongoose");
const formatResponse_1 = require("../../utils/formatResponse");
const department_1 = require("../models/department");
const scheduleSchema_1 = require("../validators/scheduleSchema");
exports.createSchedule = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const createScheduleData = req.body;
    const validation = scheduleSchema_1.scheduleRequestSchema.safeParse(createScheduleData);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const { subjectId, lectureNumber, topicName, description, plannedDate, dateOfLecture, confirmation, remarks } = validation.data;
    const newSchedule = {
        lectureNumber,
        topicName,
        description,
        plannedDate,
        dateOfLecture,
        confirmation,
        remarks
    };
    const updatedDepartment = yield department_1.DepartmentModel.findOneAndUpdate({
        "courses.semester.subjectDetails._id": subjectId
    }, {
        $push: { "courses.$.semester.$[sem].subjectDetails.$[subj].schedule": newSchedule }
    }, {
        new: true,
        arrayFilters: [
            { "sem.subjectDetails._id": subjectId },
            { "subj._id": subjectId }
        ],
        projection: {
            "courses": {
                $elemMatch: {
                    "semester.subjectDetails._id": subjectId
                }
            }
        }
    });
    return (0, formatResponse_1.formatResponse)(res, 201, "Schedule Created Successfully", true, updatedDepartment);
}));
exports.updateSchedule = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const updateScheduleData = req.body;
    const validation = scheduleSchema_1.scheduleUpdateSchema.safeParse(updateScheduleData);
    if (!validation.success)
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    const { scheduleId, topicName, lectureNumber, description, dateOfLecture, plannedDate, confirmation, remarks } = validation.data;
    const updatedDepartment = yield department_1.DepartmentModel.findOneAndUpdate({
        "courses.semester.subjectDetails.schedule._id": scheduleId
    }, {
        $set: {
            "courses.$.semester.$[sem].subjectDetails.$[subj].schedule.$[sched].lectureNumber": lectureNumber,
            "courses.$.semester.$[sem].subjectDetails.$[subj].schedule.$[sched].topicName": topicName,
            "courses.$.semester.$[sem].subjectDetails.$[subj].schedule.$[sched].description": description,
            "courses.$.semester.$[sem].subjectDetails.$[subj].schedule.$[sched].plannedDate": plannedDate,
            "courses.$.semester.$[sem].subjectDetails.$[subj].schedule.$[sched].dateOfLecture": dateOfLecture,
            "courses.$.semester.$[sem].subjectDetails.$[subj].schedule.$[sched].confirmation": confirmation,
            "courses.$.semester.$[sem].subjectDetails.$[subj].schedule.$[sched].remarks": remarks
        }
    }, {
        new: true,
        arrayFilters: [
            { "sem.subjectDetails.schedule._id": scheduleId },
            { "subj.schedule._id": scheduleId },
            { "sched._id": scheduleId }
        ],
        projection: {
            "courses": {
                $elemMatch: {
                    "semester.subjectDetails.schedule._id": scheduleId
                }
            }
        }
    });
    return (0, formatResponse_1.formatResponse)(res, 200, "Schedule Updated Successfully", true, updatedDepartment);
}));
exports.deleteSchedule = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { subjectId, scheduleId } = req.body;
    if (!mongoose_1.Types.ObjectId.isValid(subjectId) || !mongoose_1.Types.ObjectId.isValid(scheduleId)) {
        throw (0, http_errors_1.default)(400, "Invalid subjectId or scheduleId");
    }
    const updatedDepartment = yield department_1.DepartmentModel.findOneAndUpdate({
        "courses.semester.subjectDetails._id": subjectId,
        "courses.semester.subjectDetails.schedule._id": scheduleId
    }, {
        $pull: {
            "courses.$.semester.$[sem].subjectDetails.$[subj].schedule": { _id: scheduleId }
        }
    }, {
        new: true,
        arrayFilters: [
            { "sem.subjectDetails._id": subjectId },
            { "subj._id": subjectId }
        ],
        projection: {
            "courses": {
                $elemMatch: {
                    "semester.subjectDetails._id": subjectId
                }
            }
        }
    });
    return (0, formatResponse_1.formatResponse)(res, 200, "Schedule deleted successfully", true, updatedDepartment);
}));
