import mongoose from 'mongoose';
import { SpreadSheetMetaData } from '../crm/models/spreadSheet';
import logger from './logger';

const connectToDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_DATABASE_URL!, { dbName: process.env.MONGODB_DATABASE_NAME });
    logger.info('Database connected successfully !');
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

export const initializeDB = async () => {
  try {
    const existingDoc = await SpreadSheetMetaData.findOne({ name: process.env.MARKETING_SHEET });
    if (!existingDoc) {
      await SpreadSheetMetaData.create({
        name: process.env.MARKETING_SHEET,
        lastIdxMarketingSheet: 1
      });
      logger.debug('Initialized database with default Marketing Sheet entry.');
    } else {
      console.log('Marketing Sheet entry already exists.');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

export default connectToDatabase;
