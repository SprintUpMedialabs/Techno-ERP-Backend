import mongoose from 'mongoose';
import { EnquiryApplicationId } from '../admission/models/enquiryIdMetaDataSchema';
import { MONGODB_DATABASE_NAME, MONGODB_DATABASE_URL } from '../secrets';
import { DropDownMetaData } from '../utilityModules/dropdown/dropDownMetaDeta';
import { DropDownType, FormNoPrefixes, PHOTO } from './constants';
import logger from './logger';
import { fixCourseCodeList } from './metadata';
import { fixCityList } from './metadata';
import { TechnoMetaData } from './models/TechnoMetaData';

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
    // const existingDoc = await SpreadSheetMetaData.find({ name: MARKETING_SHEET });
    // if (existingDoc.length == 0) {
    //   await SpreadSheetMetaData.create({
    //     name: MARKETING_SHEET,
    //     lastIdxMarketingSheet: 1
    //   });
    //   logger.debug('Initialized database with default Marketing Sheet entry.');
    // } else {
    //   logger.debug('Marketing Sheet entry already exists.');
    // }

    const prefixes = [FormNoPrefixes.TIHS, FormNoPrefixes.TCL, FormNoPrefixes.TIMS, PHOTO];

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

    await initializeCounter("transactionID", 0);

    await initializeDropDowns();

    await initializeCourseMetadata();

  } 
  catch (error) {
    logger.error('Error initializing database:', error);
    process.exit(1);
  }
};


const initializeCounter = async(name : string, startValue : number = 0) => {
  const existingCounter = await TechnoMetaData.findOne({ name });
  if (!existingCounter) {
    await TechnoMetaData.create({
      name,
      value: startValue
    });
    logger.debug(`Initialized ${name} counter with starting value ${startValue}`);
  } 
  else {
    logger.debug(`${name} counter already exists with value ${existingCounter.value}`);
  }
}

const initializeDropDowns = async () => {
  // City Dropdown => no need to add values from our side as its going to be used for marketing module only as of now
  const existingCityDropDown = await DropDownMetaData.findOne({ type: DropDownType.MARKETING_CITY });
  if (!existingCityDropDown) {
    await DropDownMetaData.create({
      type: DropDownType.MARKETING_CITY,
    });
  }

  // Marketing Source Dropdown => no need to add values from our side as its going to be used for marketing module only as of now
  const existingSourceDropDown = await DropDownMetaData.findOne({ type: DropDownType.MARKETING_SOURCE });
  if (!existingSourceDropDown) {
    await DropDownMetaData.create({
      type: DropDownType.MARKETING_SOURCE,
    });
  }


  // Course Dropdown => no need to add values from our side as its going to be used for marketing module only as of now
  const existingCourseDropDown = await DropDownMetaData.findOne({ type: DropDownType.MARKETING_COURSE_CODE });
  if (!existingCourseDropDown) {
    await DropDownMetaData.create({
      type: DropDownType.MARKETING_COURSE_CODE,
    });
  }

  // Fix City Dropdown
  const existingFixCityDropDown = await DropDownMetaData.findOne({ type: DropDownType.FIX_MARKETING_CITY });
  const fixCityDropdownSet = new Set(existingFixCityDropDown?.value || []);
  fixCityList.forEach(city => fixCityDropdownSet.add(city));
  const sortedCityValues = Array.from(fixCityDropdownSet).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });
  await DropDownMetaData.findOneAndUpdate(
    { type: DropDownType.FIX_MARKETING_CITY },
    { value: sortedCityValues },
    { upsert: true }
  );

  // Fix Course Dropdown
  const existingFixCourseDropDown = await DropDownMetaData.findOne({ type: DropDownType.FIX_MARKETING_COURSE_CODE });
  const fixCourseDropdownSet = new Set(existingFixCourseDropDown?.value || []);
  fixCourseCodeList.forEach(code => fixCourseDropdownSet.add(code));
  const sortedValues = Array.from(fixCourseDropdownSet).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });
  await DropDownMetaData.findOneAndUpdate(
    { type: DropDownType.FIX_MARKETING_COURSE_CODE },
    { value: sortedValues },
    { upsert: true }
  );

  // District Dropdown
  const existingDistrictDropDown = await DropDownMetaData.findOne({ type: DropDownType.DISTRICT });
  const districtDropdownSet = new Set(existingDistrictDropDown?.value || []);
  fixCityList.forEach(district => districtDropdownSet.add(district));
  const sortedDistrictValues = Array.from(districtDropdownSet).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });
  await DropDownMetaData.findOneAndUpdate(
    { type: DropDownType.DISTRICT },
    { value: sortedDistrictValues },
    { upsert: true }
  );
}

const initializeCourseMetadata = async () => {
  
}
export default connectToDatabase;
