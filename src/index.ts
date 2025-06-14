import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import path from 'path';
import connectToDatabase, { initializeDB } from './config/database';
import logger from './config/logger';
import { validateEnvVariables } from './config/validateEnv';
import { errorHandler } from './middleware/error';
import { apiRouter } from './route';
import { PORT } from './secrets';
import { v1Router } from './v1Router';

const app = express();

let envFile;

if (process.env.NODE_ENV === 'production') {
  envFile = '.env.prod';
} else if (process.env.NODE_ENV === 'uat') {
  envFile = '.env.uat';
} else {
  envFile = '.env';
}

dotenv.config({ path: path.resolve(__dirname, envFile) });


validateEnvVariables();

app.use(express.json());
app.use(cookieParser());

const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL] // PROD ENV
    : '*'; // Allow all origins in DEV ENV

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean | string) => void) => {
    if (!origin || allowedOrigins === '*' || allowedOrigins.includes(origin)) {
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
app.use('/api/v1', v1Router);
app.get('/test', (req, res) => {
  res.send('Hello World');
});

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
