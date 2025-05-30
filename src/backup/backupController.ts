import { exec } from "child_process";
import expressAsyncHandler from "express-async-handler";
import fs from "fs";
import { AuthenticatedRequest } from "../auth/validators/authenticatedRequest";
import logger from "../config/logger";
import { uploadBackupToS3 } from "../config/s3Upload";
import { MONGODB_DATABASE_URL } from "../secrets";
import { formatResponse } from "../utils/formatResponse";

import { Router } from "express";
import { PipelineName, UserRoles } from "../config/constants";
import { authenticate, authorize } from "../middleware/jwtAuthenticationMiddleware";
import { retryMechanism } from "../config/retryMechanism";
import { createPipeline } from "../pipline/controller";
export const backupRoute = Router();

backupRoute.get('/', authenticate, authorize([UserRoles.SYSTEM_ADMIN]), expressAsyncHandler(async (_: AuthenticatedRequest, res) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dumpDir = `backup-${timestamp}`;
    const dumpFile = `${dumpDir}.tar.gz`;

    const pipelineId = await createPipeline(PipelineName.BACKUP);
    const emailSubject = 'Database Backup Failed';
    const emailMessage = 'The backup process failed after multiple attempts. Manual intervention may be required.';

    await retryMechanism(
        async (_session) => {
            await new Promise((resolve, reject) => {
                exec(`mongodump --uri="${MONGODB_DATABASE_URL}" --out=${dumpDir}`, (error, stdout, stderr) => {
                    if (error) return reject(`mongodump error: ${stderr}`);
                    resolve(stdout);
                });
            });

            await new Promise((resolve, reject) => {
                exec(`tar -zcvf ${dumpFile} ${dumpDir}`, (error, stdout, stderr) => {
                    if (error) return reject(`tar error: ${stderr}`);
                    resolve(stdout);
                });
            });

            const fileStream = fs.createReadStream(dumpFile);
            await uploadBackupToS3(dumpFile, fileStream);
        },
        emailSubject,
        emailMessage,
        pipelineId!,
        PipelineName.BACKUP
    );

    try {
        if (fs.existsSync(dumpDir)) fs.rmSync(dumpDir, { recursive: true, force: true });
        if (fs.existsSync(dumpFile)) fs.unlinkSync(dumpFile);
    } catch (cleanupError) {
        logger.warn('Cleanup warning:', cleanupError);
    }

    return formatResponse(res, 200, 'Backup created and uploaded to S3.', true);
}));
