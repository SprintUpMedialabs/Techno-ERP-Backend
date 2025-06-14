// src/sqs/sqsProducer.ts
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { AWS_SQS_REGION } from "../secrets";

const sqsClient = new SQSClient({ region: AWS_SQS_REGION });

export const sendMessageToQueue = async (queueUrl: string, payload: any) => {
    const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(payload),
    });

    try {
        await sqsClient.send(command);
        console.log('Message sent to SQS');
    } catch (err) {
        console.error("Failed to send message to SQS", err);
    }
};