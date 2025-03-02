import express from 'express';
import dotenv from 'dotenv';
import logger from './config/logger';
import morgan from 'morgan';
import { errorHandler } from './middleware/error';

dotenv.config();

const app = express();
app.use(express.json());
app.use(errorHandler);

app.use(
  morgan(':method :url :status :response-time ms', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  })
);

app.listen(process.env.PORT, () => {
  logger.info(`Started Your Application on Port ${process.env.PORT}`);
});
