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
exports.backupRoute = void 0;
const child_process_1 = require("child_process");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = __importDefault(require("../config/logger"));
const s3Upload_1 = require("../config/s3Upload");
const secrets_1 = require("../secrets");
const formatResponse_1 = require("../utils/formatResponse");
const express_1 = require("express");
const constants_1 = require("../config/constants");
const jwtAuthenticationMiddleware_1 = require("../middleware/jwtAuthenticationMiddleware");
const retryMechanism_1 = require("../config/retryMechanism");
const controller_1 = require("../pipline/controller");
exports.backupRoute = (0, express_1.Router)();
exports.backupRoute.get('/', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([constants_1.UserRoles.SYSTEM_ADMIN]), (0, express_async_handler_1.default)((_, res) => __awaiter(void 0, void 0, void 0, function* () {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dumpDir = `backup-${timestamp}`;
    const dumpFile = `${dumpDir}.tar.gz`;
    const pipelineId = yield (0, controller_1.createPipeline)(constants_1.PipelineName.BACKUP);
    const emailSubject = 'Database Backup Failed';
    const emailMessage = 'The backup process failed after multiple attempts. Manual intervention may be required.';
    yield (0, retryMechanism_1.retryMechanism)((_session) => __awaiter(void 0, void 0, void 0, function* () {
        yield new Promise((resolve, reject) => {
            (0, child_process_1.exec)(`mongodump --uri="${secrets_1.MONGODB_DATABASE_URL}" --out=${dumpDir}`, (error, stdout, stderr) => {
                if (error)
                    return reject(`mongodump error: ${stderr}`);
                resolve(stdout);
            });
        });
        yield new Promise((resolve, reject) => {
            (0, child_process_1.exec)(`tar -zcvf ${dumpFile} ${dumpDir}`, (error, stdout, stderr) => {
                if (error)
                    return reject(`tar error: ${stderr}`);
                resolve(stdout);
            });
        });
        const fileStream = fs_1.default.createReadStream(dumpFile);
        yield (0, s3Upload_1.uploadBackupToS3)(dumpFile, fileStream);
    }), emailSubject, emailMessage, pipelineId, constants_1.PipelineName.BACKUP);
    try {
        if (fs_1.default.existsSync(dumpDir))
            fs_1.default.rmSync(dumpDir, { recursive: true, force: true });
        if (fs_1.default.existsSync(dumpFile))
            fs_1.default.unlinkSync(dumpFile);
    }
    catch (cleanupError) {
        logger_1.default.warn('Cleanup warning:', cleanupError);
    }
    return (0, formatResponse_1.formatResponse)(res, 200, 'Backup created and uploaded to S3.', true);
})));
