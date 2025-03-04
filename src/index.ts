import express from 'express';
import dotenv from 'dotenv';
import logger from './config/logger';
import morgan from 'morgan';
import { errorHandler } from './middleware/error';
import { apiRouter } from './auth/routes';
import { PORT } from './secrets';
import cookieParser from 'cookie-parser';
import connectToDatabase from './config/database';

const app = express();
dotenv.config();
app.use(express.json());
app.use(errorHandler);
app.use(cookieParser());

connectToDatabase();

app.use('/api', apiRouter);

app.use(
  morgan(':method :url :status :response-time ms', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  })
);

app.listen(PORT, () => {
  logger.info(`Started Your Application on Port ${PORT}`);
});
