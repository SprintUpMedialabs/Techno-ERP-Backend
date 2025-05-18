import createHttpError from 'http-errors';
import moment from 'moment-timezone';
import { PipelineRunLog, IPipelineRunLogDocument } from './pipelineRunLog ';
import { PipelineStatus } from '../config/constants';
import logger from '../config/logger';
import { sendEmail } from '../config/mailer';
import { DEVELOPER_EMAIL } from '../secrets';

/**
 * 1. Create a new pipeline log and return its ID.
 */
export const createPipeline = async (name: string): Promise<string | undefined> => {
    try {
        if (!name) throw createHttpError(400, 'Pipeline name is required');

        const now = moment().tz('Asia/Kolkata');

        const newPipeline: IPipelineRunLogDocument = await PipelineRunLog.create({
            pipelineName: name,
            status: PipelineStatus.STARTED,
            attemptNo: 1,
            durationInSeconds: 0,
            startedAt: now.toDate(),
        });
        console.log("New pipeline is : ", newPipeline);
        return newPipeline.id.toString();
    } catch (error: any) {
        await sendEmail(DEVELOPER_EMAIL, "Error in creating pipeline : ", error.message);
        logger.error("Error in creating pipeline : ", error);
        throw createHttpError(400, error.message);
    }
};

/**
 * 2. Increment attempt count and optionally log an error message.
 */
export const incrementAttempt = async (id: string, errorMessage?: string): Promise<void | undefined> => {
    try {
        const exists = await PipelineRunLog.exists({ _id: id });
        if (!exists) return;

        const update: any = { $inc: { attemptNo: 1 } };
        if (errorMessage) update.$push = { errorMessages: errorMessage };

        await PipelineRunLog.findByIdAndUpdate(id, update);
    } catch (error: any) {
        await sendEmail(DEVELOPER_EMAIL, "Error in incrementing attempt : ", error.message);
        logger.error("Error in incrementing attempt : ", error);
    }
};

/**
 * 3. Mark the pipeline as failed, log error message, and update duration.
 */
export const markFailed = async (id: string, errorMessage?: string): Promise<void | undefined> => {
    try {
        const pipeline = await PipelineRunLog.findById(id);
        if (!pipeline) return;

        const now = moment().tz('Asia/Kolkata');
        const duration = moment.duration(now.diff(moment(pipeline.startedAt))).asSeconds();

        const update: any = {
            status: PipelineStatus.FAILED,
            durationInSeconds: Math.round(duration),
        };
        if (errorMessage) update.$push = { errorMessages: errorMessage };

        await PipelineRunLog.findByIdAndUpdate(id, update);
    } catch (error: any) {
        await sendEmail(DEVELOPER_EMAIL, "Error in marking pipeline as failed : ", error.message);
        logger.error("Error in marking pipeline as failed : ", error);
    }
};

/**
 * 4. Push only an error message.
 */
export const addErrorMessage = async (id: string, errorMessage: string): Promise<void | undefined> => {
    if (!errorMessage) return;
    try {
        const exists = await PipelineRunLog.exists({ _id: id });
        if (!exists) return;

        await PipelineRunLog.findByIdAndUpdate(id, {
            $push: { errorMessages: errorMessage },
        });
    } catch (error: any) {
        await sendEmail(DEVELOPER_EMAIL, "Error in adding error message to pipeline : ", error.message);
        logger.error("Error in adding error message to pipeline : ", error);
    }
};

/**
 * 5. Mark the pipeline as completed and calculate duration.
 */
export const markCompleted = async (id: string): Promise<void | undefined> => {
    try {
        const pipeline = await PipelineRunLog.findById(id);
        if (!pipeline) return;

        const now = moment().tz('Asia/Kolkata');
        const duration = moment.duration(now.diff(moment(pipeline.startedAt))).asSeconds();

        await PipelineRunLog.findByIdAndUpdate(id, {
            status: PipelineStatus.COMPLETED,
            durationInSeconds: Math.round(duration),
        });
    } catch (error: any) {
        await sendEmail(DEVELOPER_EMAIL, "Error in marking pipeline as completed : ", error.message);
        logger.error("Error in marking pipeline as completed : ", error);
    }
};
