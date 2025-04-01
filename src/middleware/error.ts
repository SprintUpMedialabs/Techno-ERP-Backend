import { NextFunction, Request, Response } from 'express';
import logger from '../config/logger';
import { formatResponse } from '../utils/formatResponse';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(
    `Error occurred during ${req.method} request to ${req.url} | Status: ${err.statusCode || 500} | Message: ${err.message || 'No error message'} | Stack: ${err.stack || 'No stack trace'}`
  );

  // if statusCode is there it means that message will also be created by us
  // if statusCode is not there it means that message is not created by us its something else in this situation we want to send internal server error.
  let statusCode = err.statusCode ? err.statusCode : 500;
  let message = err.statusCode? err.message : 'Internal Server Error. Please try again later.'


  return formatResponse(res, statusCode, message, false, null, message);

};
