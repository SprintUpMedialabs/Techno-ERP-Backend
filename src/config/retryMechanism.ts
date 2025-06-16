import createHttpError from "http-errors";
import mongoose from "mongoose";
import { incrementAttempt, markCompleted, markFailed } from "../pipline/controller";
import { PipelineName } from "./constants";

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
            if (attempt == maxRetries) {
                await markFailed(pipelineId, error.message);
                throw createHttpError(400, error.message);
            } else {
                await incrementAttempt(pipelineId, error.message);
            }
            await new Promise(res => setTimeout(res, delayMs));
        }
    }
}