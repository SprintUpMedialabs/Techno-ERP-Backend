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
exports.sendTodayPipelineSummaryEmail = exports.markCompleted = exports.addErrorMessage = exports.markFailed = exports.incrementAttempt = exports.createPipeline = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const pipelineRunLog_1 = require("./pipelineRunLog ");
const constants_1 = require("../config/constants");
const logger_1 = __importDefault(require("../config/logger"));
const mailer_1 = require("../config/mailer");
const secrets_1 = require("../secrets");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const formatResponse_1 = require("../utils/formatResponse");
/**
 * 1. Create a new pipeline log and return its ID.
 */
const createPipeline = (name) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!name)
            throw (0, http_errors_1.default)(400, 'Pipeline name is required');
        const now = (0, moment_timezone_1.default)().tz('Asia/Kolkata');
        const newPipeline = yield pipelineRunLog_1.PipelineRunLog.create({
            pipelineName: name,
            status: constants_1.PipelineStatus.STARTED,
            attemptNo: 1,
            durationInSeconds: 0,
            startedAt: now.toDate(),
        });
        console.log("New pipeline is : ", newPipeline);
        return newPipeline.id.toString();
    }
    catch (error) {
        yield (0, mailer_1.sendEmail)(secrets_1.DEVELOPER_EMAIL, "Error in creating pipeline : ", error.message);
        logger_1.default.error("Error in creating pipeline : ", error);
        throw (0, http_errors_1.default)(400, error.message);
    }
});
exports.createPipeline = createPipeline;
/**
 * 2. Increment attempt count and optionally log an error message.
 */
const incrementAttempt = (id, errorMessage) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const exists = yield pipelineRunLog_1.PipelineRunLog.exists({ _id: id });
        if (!exists)
            return;
        const update = { $inc: { attemptNo: 1 } };
        if (errorMessage)
            update.$push = { errorMessages: errorMessage };
        yield pipelineRunLog_1.PipelineRunLog.findByIdAndUpdate(id, update);
    }
    catch (error) {
        yield (0, mailer_1.sendEmail)(secrets_1.DEVELOPER_EMAIL, "Error in incrementing attempt : ", error.message);
        logger_1.default.error("Error in incrementing attempt : ", error);
    }
});
exports.incrementAttempt = incrementAttempt;
/**
 * 3. Mark the pipeline as failed, log error message, and update duration.
 */
const markFailed = (id, errorMessage) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pipeline = yield pipelineRunLog_1.PipelineRunLog.findById(id);
        if (!pipeline)
            return;
        const now = (0, moment_timezone_1.default)().tz('Asia/Kolkata');
        const duration = moment_timezone_1.default.duration(now.diff((0, moment_timezone_1.default)(pipeline.startedAt))).asSeconds();
        const update = {
            status: constants_1.PipelineStatus.FAILED,
            durationInSeconds: Math.round(duration),
        };
        if (errorMessage)
            update.$push = { errorMessages: errorMessage };
        yield pipelineRunLog_1.PipelineRunLog.findByIdAndUpdate(id, update);
    }
    catch (error) {
        yield (0, mailer_1.sendEmail)(secrets_1.DEVELOPER_EMAIL, "Error in marking pipeline as failed : ", error.message);
        logger_1.default.error("Error in marking pipeline as failed : ", error);
    }
});
exports.markFailed = markFailed;
/**
 * 4. Push only an error message.
 */
const addErrorMessage = (id, errorMessage) => __awaiter(void 0, void 0, void 0, function* () {
    if (!errorMessage)
        return;
    try {
        const exists = yield pipelineRunLog_1.PipelineRunLog.exists({ _id: id });
        if (!exists)
            return;
        yield pipelineRunLog_1.PipelineRunLog.findByIdAndUpdate(id, {
            $push: { errorMessages: errorMessage },
        });
    }
    catch (error) {
        yield (0, mailer_1.sendEmail)(secrets_1.DEVELOPER_EMAIL, "Error in adding error message to pipeline : ", error.message);
        logger_1.default.error("Error in adding error message to pipeline : ", error);
    }
});
exports.addErrorMessage = addErrorMessage;
/**
 * 5. Mark the pipeline as completed and calculate duration.
 */
const markCompleted = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pipeline = yield pipelineRunLog_1.PipelineRunLog.findById(id);
        if (!pipeline)
            return;
        const now = (0, moment_timezone_1.default)().tz('Asia/Kolkata');
        const duration = moment_timezone_1.default.duration(now.diff((0, moment_timezone_1.default)(pipeline.startedAt))).asSeconds();
        yield pipelineRunLog_1.PipelineRunLog.findByIdAndUpdate(id, {
            status: constants_1.PipelineStatus.COMPLETED,
            durationInSeconds: Math.round(duration),
        });
    }
    catch (error) {
        yield (0, mailer_1.sendEmail)(secrets_1.DEVELOPER_EMAIL, "Error in marking pipeline as completed : ", error.message);
        logger_1.default.error("Error in marking pipeline as completed : ", error);
    }
});
exports.markCompleted = markCompleted;
exports.sendTodayPipelineSummaryEmail = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const todayIST = (0, moment_timezone_1.default)().tz('Asia/Kolkata').startOf('day').toDate();
    const pipelines = yield pipelineRunLog_1.PipelineRunLog.find({ date: todayIST }).sort({ time: -1 });
    const today = (0, moment_timezone_1.default)().tz('Asia/Kolkata').format('YYYY-MM-DD');
    if (pipelines.length === 0) {
        yield (0, mailer_1.sendEmail)(secrets_1.DEVELOPER_EMAIL, `Pipeline Summary - ${today}`, 'No pipelines ran today.');
        return;
    }
    const tableRows = pipelines.map((log) => {
        var _a, _b, _c, _d;
        return `
      <tr>
        <td>${log.pipelineName}</td>
        <td>${log.status}</td>
        <td>${log.attemptNo}</td>
        <td>${(_a = log.durationInSeconds) !== null && _a !== void 0 ? _a : 0}s</td>
        <td>${(0, moment_timezone_1.default)(log.startedAt).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss')}</td>
        <td>
          ${((_c = (_b = log === null || log === void 0 ? void 0 : log.errorMessages) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0) > 0
            ? `<ul>${((_d = log === null || log === void 0 ? void 0 : log.errorMessages) !== null && _d !== void 0 ? _d : []).map((e) => `<li>${e}</li>`).join('')}</ul>`
            : 'None'}
        </td>
      </tr>
    `;
    }).join('');
    const html = `
      <h2>Pipeline Run Summary - ${today}</h2>
      <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
        <thead>
          <tr>
            <th>Pipeline Name</th>
            <th>Status</th>
            <th>Attempts</th>
            <th>Duration (seconds)</th>
            <th>Started At</th>
            <th>Error Messages</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;
    yield (0, mailer_1.sendEmail)(secrets_1.DEVELOPER_EMAIL, `Pipeline Summary - ${today}`, html);
    return (0, formatResponse_1.formatResponse)(res, 200, "Pipeline summary email sent successfully", true);
}));
