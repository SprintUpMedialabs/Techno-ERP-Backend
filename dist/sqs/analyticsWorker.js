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
exports.pollMessages = void 0;
// worker/analyticsWorker.ts
const client_sqs_1 = require("@aws-sdk/client-sqs");
const sqsClient = new client_sqs_1.SQSClient({ region: "ap-south-1" });
const QUEUE_URL = 'https://sqs.ap-south-1.amazonaws.com/061051259770/marketing-admin-analytics';
const pollMessages = () => __awaiter(void 0, void 0, void 0, function* () {
    const command = new client_sqs_1.ReceiveMessageCommand({
        QueueUrl: QUEUE_URL,
        MaxNumberOfMessages: 5,
        WaitTimeSeconds: 10,
    });
    try {
        const data = yield sqsClient.send(command);
        console.log('data', data.Messages);
        console.log("===================================");
        if (data.Messages) {
            for (const msg of data.Messages) {
                const body = JSON.parse(msg.Body);
                // Do your analytics DB update here
                // console.log("Processing event:", body);
                // Delete the message after processing
                // await sqsClient.send(new DeleteMessageCommand({
                //   QueueUrl: QUEUE_URL,
                //   ReceiptHandle: msg.ReceiptHandle!,
                // }));
            }
        }
    }
    catch (err) {
        console.error("Error processing message", err);
    }
    // Recursively poll
    setImmediate(exports.pollMessages);
});
exports.pollMessages = pollMessages;
(0, exports.pollMessages)();
