import createHttpError from 'http-errors';
import moment from 'moment-timezone';
import { PipelineRunLog, IPipelineRunLogDocument } from './pipelineRunLog ';
import { PipelineStatus } from '../config/constants';
import logger from '../config/logger';
import { sendEmail } from '../config/mailer';
import { DEVELOPER_EMAIL } from '../secrets';
import expressAsyncHandler from 'express-async-handler';
import { Response } from 'express';
import { AuthenticatedRequest } from '../auth/validators/authenticatedRequest';
import { formatResponse } from '../utils/formatResponse';

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


export const sendTodayPipelineSummaryEmail = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const todayIST = moment().tz('Asia/Kolkata').startOf('day').toDate();

    const pipelines = await PipelineRunLog.find({ date: todayIST }).sort({ time: -1 });
    const today = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');

    if (pipelines.length === 0) {
        await sendEmail(DEVELOPER_EMAIL, `Pipeline Summary - ${today}`, 'No pipelines ran today.');
        return;
    }

    const tableRows = pipelines.map((log) => `
      <tr>
        <td>${log.pipelineName}</td>
        <td>${log.status}</td>
        <td>${log.attemptNo}</td>
        <td>${log.durationInSeconds ?? 0}s</td>
        <td>${moment(log.startedAt).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss')}</td>
        <td>
          ${(log?.errorMessages?.length ?? 0) > 0
            ? `<ul>${(log?.errorMessages ?? []).map((e: string) => `<li>${e}</li>`).join('')}</ul>`
            : 'None'}
        </td>
      </tr>
    `).join('');

    const html = `
      <h2>Pipeline Run Summary - ${today}</h2>
      <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
        <thead>
          <tr>
            <th>Pipeline Name</th>
            <th>Status</th>
            <th>Attempts</th>
            <th>Duration (seconds)</th>
            <th>Started At</th>
            <th>Error Messages</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;

    await sendEmail(DEVELOPER_EMAIL, `Pipeline Summary - ${today}`, html);
    return formatResponse(res, 200, "Pipeline summary email sent successfully", true);
});