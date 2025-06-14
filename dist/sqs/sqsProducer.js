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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageToQueue = void 0;
// src/sqs/sqsProducer.ts
const client_sqs_1 = require("@aws-sdk/client-sqs");
const secrets_1 = require("../secrets");
const sqsClient = new client_sqs_1.SQSClient({ region: secrets_1.AWS_SQS_REGION });
const sendMessageToQueue = (queueUrl, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const command = new client_sqs_1.SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(payload),
    });
    try {
        yield sqsClient.send(command);
        console.log('Message sent to SQS');
    }
    catch (err) {
        console.error("Failed to send message to SQS", err);
    }
});
exports.sendMessageToQueue = sendMessageToQueue;
