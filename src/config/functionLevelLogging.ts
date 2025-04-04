import { Response } from "express";
import { AuthenticatedRequest } from "../auth/validators/authenticatedRequest";
import expressAsyncHandler from "express-async-handler";
import logger from "./logger";
import createHttpError from "http-errors";

export const functionLevelLogger = (fn: (req: AuthenticatedRequest, res: Response) => Promise<any>) => expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    logger.info(`[START] ${fn.name} - ${req.method} ${req.originalUrl}`);
    try 
    {
        await fn(req, res);
        logger.info(`[END] ${fn.name}`);
    } 
    catch (err : any) {
        logger.error(`[ERROR] ${fn.name}:`, err);
        throw createHttpError(400, err);
    }
});
