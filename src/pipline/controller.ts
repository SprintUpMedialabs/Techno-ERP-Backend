import createHttpError from 'http-errors';
import moment from 'moment-timezone';
import { PipelineRunLog, PipelineStatus, IPipelineRunLogDocument } from './pipelineRunLog ';

/**
 * 1. Create a new pipeline log and return its ID.
 */
export const createPipeline = async (name: string): Promise<string> => {
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
};

/**
 * 2. Increment attempt count and optionally log an error message.
 */
export const incrementAttempt = async (id: string, errorMessage?: string): Promise<void> => {
    const exists = await PipelineRunLog.exists({ _id: id });
    if (!exists) throw createHttpError(404, 'Pipeline not found');

    const update: any = { $inc: { attemptNo: 1 } };
    if (errorMessage) update.$push = { errorMessages: errorMessage };

    await PipelineRunLog.findByIdAndUpdate(id, update);
};

/**
 * 3. Mark the pipeline as failed, log error message, and update duration.
 */
export const markFailed = async (id: string, errorMessage?: string): Promise<void> => {
    const pipeline = await PipelineRunLog.findById(id);
    if (!pipeline) throw createHttpError(404, 'Pipeline not found');

    const now = moment().tz('Asia/Kolkata');
    const duration = moment.duration(now.diff(moment(pipeline.startedAt))).asSeconds();

    const update: any = {
        status: PipelineStatus.FAILED,
        durationInSeconds: Math.round(duration),
    };
    if (errorMessage) update.$push = { errorMessages: errorMessage };

    await PipelineRunLog.findByIdAndUpdate(id, update);
};

/**
 * 4. Push only an error message.
 */
export const addErrorMessage = async (id: string, errorMessage: string): Promise<void> => {
    if (!errorMessage) throw createHttpError(400, 'Error message is required');

    const exists = await PipelineRunLog.exists({ _id: id });
    if (!exists) throw createHttpError(404, 'Pipeline not found');

    await PipelineRunLog.findByIdAndUpdate(id, {
        $push: { errorMessages: errorMessage },
    });
};

/**
 * 5. Mark the pipeline as completed and calculate duration.
 */
export const markCompleted = async (id: string): Promise<void> => {
    const pipeline = await PipelineRunLog.findById(id);
    if (!pipeline) throw createHttpError(404, 'Pipeline not found');

    const now = moment().tz('Asia/Kolkata');
    const duration = moment.duration(now.diff(moment(pipeline.startedAt))).asSeconds();

    await PipelineRunLog.findByIdAndUpdate(id, {
        status: PipelineStatus.COMPLETED,
        durationInSeconds: Math.round(duration),
    });
};
