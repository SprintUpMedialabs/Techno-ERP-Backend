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
exports.deleteFromS3AndDB = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../../config/constants");
const s3Delete_1 = require("../config/s3Delete");
const course_1 = require("../models/course");
const scheduleController_1 = require("../controllers/scheduleController");
const deleteFromS3AndDB = (crsId, semId, subId, plnId, type, documentUrl) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        let courseId = new mongoose_1.default.Types.ObjectId(crsId);
        let semesterId = new mongoose_1.default.Types.ObjectId(semId);
        let subjectId = new mongoose_1.default.Types.ObjectId(subId);
        let planId = plnId ? new mongoose_1.default.Types.ObjectId(plnId) : undefined;
        const baseFilter = {
            _id: courseId,
            "semester._id": semesterId,
            "semester.subjects._id": subjectId
        };
        const updateOperation = {};
        if (planId) {
            const config = type === constants_1.CourseMaterialType.LPLAN ? scheduleController_1.planConfigMap.lecture : scheduleController_1.planConfigMap.practical;
            const path = `semester.$[sem].subjects.$[subj].schedule.${config.mongoPlanPath}.$[plan].documents`;
            updateOperation.$pull = {
                [path]: documentUrl
            };
            yield course_1.Course.updateOne(baseFilter, updateOperation, {
                session,
                arrayFilters: [
                    { "sem._id": semesterId },
                    { "subj._id": subjectId },
                    { "plan._id": planId }
                ]
            });
        }
        else {
            const path = `semester.$[sem].subjects.$[subj].schedule.additionalResources`;
            updateOperation.$pull = {
                [path]: documentUrl
            };
            yield course_1.Course.updateOne(baseFilter, updateOperation, {
                session,
                arrayFilters: [
                    { "sem._id": semesterId },
                    { "subj._id": subjectId }
                ]
            });
        }
        yield session.commitTransaction();
        console.log("Removed the URL successfully from DB");
        session.endSession();
        yield (0, s3Delete_1.deleteFromS3)(documentUrl);
        console.log("Deleted the file successfully from AWS");
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw (0, http_errors_1.default)(404, error.message);
    }
    return;
});
exports.deleteFromS3AndDB = deleteFromS3AndDB;
