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
exports.uploadPlanDocument = exports.uploadAdditionalResources = exports.uploadScheduleDocument = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../../config/constants");
const formatResponse_1 = require("../../utils/formatResponse");
const course_1 = require("../models/course");
const s3Upload_1 = require("../config/s3Upload");
const fetchScheduleInformation_1 = require("../helpers/fetchScheduleInformation");
const planConfigMap = {
    lecture: {
        mongoPlanPath: 'lecturePlan',
        planKey: 'lp',
        materialType: constants_1.CourseMaterialType.LPLAN,
        successMessage: 'Lecture Plan uploaded successfully',
    },
    practical: {
        mongoPlanPath: 'practicalPlan',
        planKey: 'pp',
        materialType: constants_1.CourseMaterialType.PPLAN,
        successMessage: 'Practical Plan uploaded successfully',
    },
};
exports.uploadScheduleDocument = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { courseId, semesterId, subjectId, instructorId, planId, type } = req.body;
    const file = req.file;
    const uploadedData = yield (0, exports.uploadPlanDocument)(courseId, semesterId, subjectId, instructorId, planId, type, file);
    if (req.file) {
        req.file.buffer = null;
    }
    return (0, formatResponse_1.formatResponse)(res, 200, uploadedData.message, true, uploadedData.payload);
}));
exports.uploadAdditionalResources = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { courseId, semesterId, subjectId, instructorId } = req.body;
    const file = req.file;
    courseId = new mongoose_1.default.Types.ObjectId(courseId);
    semesterId = new mongoose_1.default.Types.ObjectId(semesterId);
    subjectId = new mongoose_1.default.Types.ObjectId(subjectId);
    instructorId = new mongoose_1.default.Types.ObjectId(instructorId);
    if (!courseId && !semesterId && !subjectId && !instructorId && !file)
        throw (0, http_errors_1.default)(400, 'Invalid information to upload the file. Please reverify');
    let fileUrl;
    if (file) {
        fileUrl = yield (0, s3Upload_1.uploadToS3)(courseId, semesterId, subjectId, constants_1.CourseMaterialType.GENERAL, file);
    }
    console.log(fileUrl);
    if (req.file) {
        req.file.buffer = null;
    }
    const updatedData = yield course_1.Course.findOneAndUpdate({
        _id: courseId,
        "semester._id": semesterId,
        "semester.subjects._id": subjectId,
    }, {
        $push: {
            "semester.$[sem].subjects.$[subj].schedule.additionalResources": fileUrl,
        },
    }, {
        new: true,
        arrayFilters: [
            { "sem._id": semesterId },
            { "subj._id": subjectId }
        ],
    });
    if (!updatedData)
        throw (0, http_errors_1.default)(404, 'Error occurred saving the document');
    const responsePayload = yield (0, fetchScheduleInformation_1.fetchScheduleInformation)(courseId, semesterId, subjectId, instructorId);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Additional Resource added successfully', true, responsePayload);
}));
const uploadPlanDocument = (crsId, semId, subId, insId, planId, planType, file) => __awaiter(void 0, void 0, void 0, function* () {
    const config = planType === constants_1.CourseMaterialType.LPLAN ? planConfigMap.lecture : planConfigMap.practical;
    console.log(config);
    console.log(crsId, semId, subId, planId, insId, file);
    if (!crsId && !semId && !subId && !planId && !insId && !file)
        throw (0, http_errors_1.default)(400, 'Invalid information to upload file. Please reverify!');
    let fileUrl;
    if (file) {
        fileUrl = yield (0, s3Upload_1.uploadToS3)(crsId, semId, subId, planType, file);
    }
    console.log(fileUrl);
    let courseId = new mongoose_1.default.Types.ObjectId(crsId);
    let semesterId = new mongoose_1.default.Types.ObjectId(semId);
    let subjectId = new mongoose_1.default.Types.ObjectId(subId);
    let coursePlanId = new mongoose_1.default.Types.ObjectId(planId);
    const updatedData = yield course_1.Course.findOneAndUpdate({
        _id: courseId,
        [`semester._id`]: semesterId,
        [`semester.subjects._id`]: subjectId,
        [`semester.subjects.schedule.${config.mongoPlanPath}._id`]: coursePlanId,
    }, {
        $push: {
            [`semester.$[sem].subjects.$[subj].schedule.${config.mongoPlanPath}.$[${config.planKey}].documents`]: fileUrl,
        },
    }, {
        new: true,
        arrayFilters: [
            { "sem._id": semesterId },
            { "subj._id": subjectId },
            { [`${config.planKey}._id`]: coursePlanId },
        ],
    });
    if (!updatedData)
        throw (0, http_errors_1.default)(404, 'Error occurred saving the document');
    const responsePayload = yield (0, fetchScheduleInformation_1.fetchScheduleInformation)(crsId, semId, subId, insId);
    return {
        message: config.successMessage,
        payload: responsePayload
    };
});
exports.uploadPlanDocument = uploadPlanDocument;
