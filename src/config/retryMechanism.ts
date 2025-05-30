import mongoose from "mongoose";
import { sendEmail } from "./mailer";
import { DEVELOPER_EMAIL } from "../secrets";
import createHttpError from "http-errors";
import { PipelineName } from "./constants";
import { incrementAttempt, markCompleted, markFailed } from "../pipline/controller";

export async function retryMechanism(handler: (session: mongoose.ClientSession) => Promise<void>, emailSubject: any, emailMessage: any, pipelineId: string, pipelineName: PipelineName, maxRetries = 5, delayMs = 500) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();
            await handler(session);
            await session.commitTransaction();
            session.endSession();
            await markCompleted(pipelineId);
            return;
        }
        catch (error: any) {
            await session.abortTransaction();
            session.endSession();
            await sendEmail(DEVELOPER_EMAIL, `Attempt ${attempt} : ` + emailSubject + ` ${process.env.NODE_ENV}`, error.message);
            if (attempt == maxRetries) {
                await sendEmail(DEVELOPER_EMAIL, emailSubject + ` ${process.env.NODE_ENV}`, emailMessage);
                await markFailed(pipelineId, error.message);
                throw createHttpError(400, error.message);
            } else {
                await incrementAttempt(pipelineId, error.message);
            }
            await new Promise(res => setTimeout(res, delayMs));
        }
    }
}