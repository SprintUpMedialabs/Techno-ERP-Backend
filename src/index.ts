import express from 'express';
import dotenv from 'dotenv';
import logger from './config/logger';
import morgan from 'morgan';
import { errorHandler } from './middleware/error';
import { apiRouter } from './route';
import { PORT } from './secrets';
import cookieParser from 'cookie-parser';
import connectToDatabase, { initializeDB } from './config/database';
import { validateEnvVariables } from './config/validateEnv';

const app = express();
dotenv.config();
validateEnvVariables();
app.use(express.json());
app.use(cookieParser());

connectToDatabase();
initializeDB();

app.use('/api', apiRouter);

app.use(
  morgan(':method :url :status :response-time ms', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  })
);

app.use(errorHandler);
app.listen(PORT, () => {
  logger.info(`Started Your Application on Port ${PORT}`);
});
