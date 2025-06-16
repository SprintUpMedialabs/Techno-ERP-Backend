import { Request, Response, NextFunction } from 'express';
import moment from 'moment';
import { ErrorLog } from '../utilityModules/ErrorLogModel';
import logger from '../config/logger';
import { formatResponse } from '../utils/formatResponse';

export const errorHandler = async (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode ?? 500;
  const message = err.statusCode ? err.message : 'Internal Server Error. Please try again later.';
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');

  logger.error(
    `Error occurred during ${req.method} request to ${req.url} | Status: ${statusCode} | Message: ${err.message ?? 'No error message'} | Stack: ${err.stack ?? 'No stack trace'}`
  );

  try {
    await ErrorLog.create({
      message: err.message ?? 'No error message',
      statusCode,
      date: timestamp,
    });
  } catch (logError) {
    logger.error(`Failed to save error log to DB: ${logError}`);
  }

  return formatResponse(res, statusCode, message, false, null, message);
};
