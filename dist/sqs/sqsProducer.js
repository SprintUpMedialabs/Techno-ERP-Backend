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
exports.sendMessageToQueue = void 0;
// src/sqs/sqsProducer.ts
const client_sqs_1 = require("@aws-sdk/client-sqs");
const secrets_1 = require("../secrets");
const logger_1 = __importDefault(require("../config/logger"));
const sqsClient = new client_sqs_1.SQSClient({ region: secrets_1.AWS_SQS_REGION });
const sendMessageToQueue = (queueUrl, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const command = new client_sqs_1.SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(payload),
    });
    try {
        yield sqsClient.send(command);
        logger_1.default.info('Message sent to SQS queueUrl: ', queueUrl, ' | payload: ', payload);
    }
    catch (err) {
        logger_1.default.error("Failed to send message to SQS", err);
    }
});
exports.sendMessageToQueue = sendMessageToQueue;
