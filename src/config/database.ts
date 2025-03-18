import mongoose from 'mongoose';
import { SpreadSheetMetaData } from '../crm/models/spreadSheet';
import logger from './logger';
import { ApplicationIdPrefix, MARKETING_SHEET } from './constants';
import { MONGODB_DATABASE_NAME, MONGODB_DATABASE_URL } from '../secrets';
import { EnquiryApplicationId } from '../admission/models/enquiryApplicationIdSchema';

const connectToDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_DATABASE_URL!, {
      dbName: MONGODB_DATABASE_NAME!
    });
    logger.info('Database connected successfully !');
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

export const initializeDB = async () => {
  try {
    const existingDoc = await SpreadSheetMetaData.find({ name: MARKETING_SHEET });
    if (!existingDoc) {
      await SpreadSheetMetaData.create({
        name: MARKETING_SHEET,
        lastIdxMarketingSheet: 1
      });
      logger.debug('Initialized database with default Marketing Sheet entry.');
    } else {
      logger.debug('Marketing Sheet entry already exists.');
    }

    const prefixes = [ApplicationIdPrefix.TIHS, ApplicationIdPrefix.TCL, ApplicationIdPrefix.TIMS];

    for (const prefix of prefixes) {
      const existingEntry = await EnquiryApplicationId.findOne({ prefix });

      if (!existingEntry) {
        await EnquiryApplicationId.create({
          prefix,
          lastSerialNumber: 100
        });
        logger.debug(`Initialized database with default serial number for ${prefix}`);
      } else {
        logger.debug(`${prefix} serial number already exists`);
      }
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

export default connectToDatabase;
