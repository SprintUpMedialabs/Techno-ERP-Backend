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
exports.retryMechanism = retryMechanism;
const mongoose_1 = __importDefault(require("mongoose"));
const mailer_1 = require("./mailer");
const secrets_1 = require("../secrets");
const http_errors_1 = __importDefault(require("http-errors"));
const controller_1 = require("../pipline/controller");
function retryMechanism(handler_1, emailSubject_1, emailMessage_1, pipelineId_1, pipelineName_1) {
    return __awaiter(this, arguments, void 0, function* (handler, emailSubject, emailMessage, pipelineId, pipelineName, maxRetries = 5, delayMs = 500) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const session = yield mongoose_1.default.startSession();
            try {
                session.startTransaction();
                yield handler(session);
                yield session.commitTransaction();
                session.endSession();
                yield (0, controller_1.markCompleted)(pipelineId);
                return;
            }
            catch (error) {
                yield session.abortTransaction();
                session.endSession();
                if (process.env.NODE_ENV) {
                    yield (0, mailer_1.sendEmail)(secrets_1.DEVELOPER_EMAIL, `Attempt ${attempt} : ` + emailSubject + ` ${process.env.NODE_ENV}`, error.message);
                }
                if (attempt == maxRetries) {
                    if (process.env.NODE_ENV) {
                        yield (0, mailer_1.sendEmail)(secrets_1.DEVELOPER_EMAIL, emailSubject + ` ${process.env.NODE_ENV}`, emailMessage);
                    }
                    yield (0, controller_1.markFailed)(pipelineId, error.message);
                    throw (0, http_errors_1.default)(400, error.message);
                }
                else {
                    yield (0, controller_1.incrementAttempt)(pipelineId, error.message);
                }
                yield new Promise(res => setTimeout(res, delayMs));
            }
        }
    });
}
