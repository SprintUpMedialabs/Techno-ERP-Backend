import { exec } from "child_process";
import expressAsyncHandler from "express-async-handler";
import fs from "fs";
import { AuthenticatedRequest } from "../auth/validators/authenticatedRequest";
import logger from "../config/logger";
import { uploadBackupToS3 } from "../config/s3Upload";
import { MONGODB_DATABASE_URL } from "../secrets";
import { formatResponse } from "../utils/formatResponse";

import { Router } from "express";
import { UserRoles } from "../config/constants";
import { authenticate, authorize } from "../middleware/jwtAuthenticationMiddleware";
export const backupRoute = Router();

backupRoute.get('/', authenticate, authorize([UserRoles.SYSTEM_ADMIN]), expressAsyncHandler(async (_: AuthenticatedRequest, res) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dumpDir = `backup-${timestamp}`;
    const dumpFile = `${dumpDir}.tar.gz`;

    try {
        // Step 1: Run mongodump
        await new Promise((resolve, reject) => {
            exec(`mongodump --uri="${MONGODB_DATABASE_URL}" --out=${dumpDir}`, (error, stdout, stderr) => {
                if (error) return reject(`mongodump error: ${stderr}`);
                resolve(stdout);
            });
        });

        // Step 2: Compress the dump folder
        await new Promise((resolve, reject) => {
            exec(`tar -zcvf ${dumpFile} ${dumpDir}`, (error, stdout, stderr) => {
                if (error) return reject(`tar error: ${stderr}`);
                resolve(stdout);
            });
        });

        // Step 3: Upload to S3
        const fileStream = fs.createReadStream(dumpFile);


        await uploadBackupToS3(dumpFile, fileStream);

        // Step 4: Cleanup local files
        fs.rmSync(dumpDir, { recursive: true, force: true });
        fs.unlinkSync(dumpFile);

        formatResponse(res, 200, 'Backup created and uploaded to S3.', true);
    } catch (err) {
        logger.error(err);
        throw err;
    }
}));