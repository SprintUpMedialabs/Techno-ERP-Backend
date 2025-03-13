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
import cors from 'cors';

const app = express();

dotenv.config();

validateEnvVariables();

app.use(express.json());
app.use(cookieParser());

const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? ['https://myepicfrontend.com']  //PROD ENV
    : ['*'];      //DEV ENV


const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Allow cookies and Authorization headers, if any.
};

app.use(cors(corsOptions));

app.options('*', cors(corsOptions));

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
