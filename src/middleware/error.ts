import { NextFunction, Request, Response } from 'express';
import logger from '../config/logger';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err);
  res.status(500).send({ errors: [{ message: 'Something went wrong' }] });
};
