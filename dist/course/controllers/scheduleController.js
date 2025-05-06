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
exports.deleteFileUsingUrl = exports.getScheduleInformation = exports.deletePlan = exports.batchUpdatePlan = exports.createPlan = exports.planConfigMap = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const mongoose_1 = __importDefault(require("mongoose"));
const course_1 = require("../models/course");
const formatResponse_1 = require("../../utils/formatResponse");
const http_errors_1 = __importDefault(require("http-errors"));
const scheduleSchema_1 = require("../validators/scheduleSchema");
const constants_1 = require("../../config/constants");
const s3Delete_1 = require("../config/s3Delete");
const fetchScheduleInformation_1 = require("../helpers/fetchScheduleInformation");
const deleteFromS3AndDB_1 = require("../helpers/deleteFromS3AndDB");
exports.planConfigMap = {
    lecture: {
        mongoPlanPath: 'lecturePlan',
        planKey: 'lp',
        createSuccessMessage: 'Lecture Plan created successfully',
        updateSuccessMessage: 'Lecture Plan updated successfully',
        deleteSuccessMessage: 'Lecture Plan deleted successfully'
    },
    practical: {
        mongoPlanPath: 'practicalPlan',
        planKey: 'pp',
        createSuccessMessage: 'Practical Plan created successfully',
        updateSuccessMessage: 'Practical Plan updated successfully',
        deleteSuccessMessage: 'Practical Plan deleted successfully'
    },
};
exports.createPlan = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const planData = req.body;
    const validation = scheduleSchema_1.createPlanSchema.safeParse(planData);
    if (!validation.success)
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    let { courseId, semesterId, subjectId, instructorId, type } = planData, planInformation = __rest(planData, ["courseId", "semesterId", "subjectId", "instructorId", "type"]);
    const config = type === constants_1.CourseMaterialType.LPLAN ? exports.planConfigMap.lecture : exports.planConfigMap.practical;
    courseId = new mongoose_1.default.Types.ObjectId(courseId);
    semesterId = new mongoose_1.default.Types.ObjectId(semesterId);
    subjectId = new mongoose_1.default.Types.ObjectId(subjectId);
    instructorId = new mongoose_1.default.Types.ObjectId(instructorId);
    planInformation.instructor = instructorId;
    console.log(planInformation);
    const createdSchedule = yield course_1.Course.findByIdAndUpdate(courseId, {
        $push: {
            [`semester.$[sem].subjects.$[subj].schedule.${config.mongoPlanPath}`]: planInformation,
        }
    }, {
        new: true,
        arrayFilters: [
            { "sem._id": semesterId },
            { "subj._id": subjectId }
        ]
    });
    return (0, formatResponse_1.formatResponse)(res, 200, config.createSuccessMessage, true, null);
}));
exports.batchUpdatePlan = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const planData = req.body;
    console.log(planData.data);
    const validation = scheduleSchema_1.updatePlanSchema.safeParse(planData);
    console.log(validation.error);
    console.log(planData.data);
    if (!validation.success)
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    let { courseId, semesterId, subjectId, instructorId, type, data } = planData;
    const config = type === constants_1.CourseMaterialType.LPLAN ? exports.planConfigMap.lecture : exports.planConfigMap.practical;
    courseId = new mongoose_1.default.Types.ObjectId(courseId);
    semesterId = new mongoose_1.default.Types.ObjectId(semesterId);
    subjectId = new mongoose_1.default.Types.ObjectId(subjectId);
    instructorId = new mongoose_1.default.Types.ObjectId(instructorId);
    console.log("Data to be updated", data);
    const updateResult = yield course_1.Course.updateOne({
        _id: courseId,
        "semester._id": semesterId,
        "semester.subjects._id": subjectId,
    }, {
        $set: {
            [`semester.$[sem].subjects.$[subj].schedule.${config.mongoPlanPath}`]: data,
        },
    }, {
        arrayFilters: [
            { "sem._id": semesterId },
            { "subj._id": subjectId },
        ],
    });
    console.log(updateResult.modifiedCount);
    return (0, formatResponse_1.formatResponse)(res, 200, config.updateSuccessMessage, true, null);
}));
exports.deletePlan = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const planData = req.body;
    const validation = scheduleSchema_1.deletePlanSchema.safeParse(planData);
    if (!validation.success)
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    let { courseId, semesterId, subjectId, instructorId, planId, type } = planData;
    const config = type === constants_1.CourseMaterialType.LPLAN ? exports.planConfigMap.lecture : exports.planConfigMap.practical;
    courseId = new mongoose_1.default.Types.ObjectId(courseId);
    semesterId = new mongoose_1.default.Types.ObjectId(semesterId);
    subjectId = new mongoose_1.default.Types.ObjectId(subjectId);
    instructorId = new mongoose_1.default.Types.ObjectId(instructorId);
    planId = new mongoose_1.default.Types.ObjectId(planId);
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const result = yield course_1.Course.aggregate([
            { $match: { _id: courseId } },
            { $unwind: "$semester" },
            { $match: { "semester._id": semesterId } },
            { $unwind: "$semester.subjects" },
            { $match: { "semester.subjects._id": subjectId } },
            { $unwind: `$semester.subjects.schedule.${config.mongoPlanPath}` },
            {
                $match: {
                    [`semester.subjects.schedule.${config.mongoPlanPath}._id`]: planId
                }
            },
            {
                $project: {
                    _id: 0,
                    plan: `$semester.subjects.schedule.${config.mongoPlanPath}.documents`,
                },
            },
        ]);
        const documents = ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.plan) || [];
        yield course_1.Course.updateOne({
            _id: courseId,
            "semester._id": semesterId,
            "semester.subjects._id": subjectId,
        }, {
            $pull: {
                [`semester.$[sem].subjects.$[subj].schedule.${config.mongoPlanPath}`]: { _id: planId }
            }
        }, {
            session,
            arrayFilters: [
                { "sem._id": semesterId },
                { "subj._id": subjectId },
            ]
        });
        yield session.commitTransaction();
        session.endSession();
        for (const docUrl of documents) {
            yield (0, s3Delete_1.deleteFromS3)(docUrl);
        }
        return (0, formatResponse_1.formatResponse)(res, 200, config.deleteSuccessMessage, true, null);
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw (0, http_errors_1.default)(404, error.message);
    }
}));
exports.getScheduleInformation = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { courseId, semesterId, subjectId, instructorId, search, page = 1, limit = 10 } = req.body;
    let payload = yield (0, fetchScheduleInformation_1.fetchScheduleInformation)(courseId, semesterId, subjectId, instructorId, search);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Plans fetched successfully', true, payload);
}));
// DTODO (DONE) : delete from db as well + will need to remove duplicate entries also 
exports.deleteFileUsingUrl = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    //In case of additional resource deletion, planId would be null, it will only be present for lecture plan and practical plan.
    const deleteFileData = req.body;
    const validation = scheduleSchema_1.deleteFileUsingUrlSchema.safeParse(deleteFileData);
    if (!validation.success)
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    try {
        yield (0, deleteFromS3AndDB_1.deleteFromS3AndDB)(validation.data.courseId.toString(), validation.data.semesterId.toString(), validation.data.subjectId.toString(), (_a = validation.data.planId) === null || _a === void 0 ? void 0 : _a.toString(), validation.data.type ? validation.data.type : undefined, validation.data.documentUrl);
    }
    catch (error) {
        throw (0, http_errors_1.default)(404, error.message);
    }
    return (0, formatResponse_1.formatResponse)(res, 200, 'Removed successfully from AWS and database', true);
}));
