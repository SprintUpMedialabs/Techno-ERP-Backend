import mongoose from 'mongoose';
import logger from './logger';
import createHttpError from 'http-errors';
import { MONGODB_DATABASE_NAME, MONGODB_DATABASE_URL } from '../secrets';

const connectToDatabase = async (): Promise<void> => {
  try {
    if (!MONGODB_DATABASE_URL) {
      throw createHttpError(500, 'Database URL is not defined');
    }
    await mongoose.connect(MONGODB_DATABASE_URL, { dbName: MONGODB_DATABASE_NAME || 'Techno' });
    logger.info('Database connected successfully !');
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

export default connectToDatabase;
