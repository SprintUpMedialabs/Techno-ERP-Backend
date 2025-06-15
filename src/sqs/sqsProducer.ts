// src/sqs/sqsProducer.ts
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { AWS_SQS_REGION } from "../secrets";
import logger from "../config/logger";

const sqsClient = new SQSClient({ region: AWS_SQS_REGION });

export const sendMessageToQueue = async (queueUrl: string, payload: any) => {
    const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(payload),
    });

    try {
        await sqsClient.send(command);
        logger.info('Message sent to SQS queueUrl: ', queueUrl, ' | payload: ', payload);
    } catch (err) {
        logger.error("Failed to send message to SQS", err);
    }
};