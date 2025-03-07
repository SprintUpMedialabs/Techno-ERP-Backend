import expressAsyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../auth/validators/authenticatedRequest';
import { User } from '../../auth/models/user';
import { Gender, LeadType, UserRoles } from '../../config/constants';
import logger from '../../config/logger';
import { readFromGoogleSheet } from '../helpers/googleSheetOperations';
import { leadSchema } from '../validators/leads';
import { Lead } from '../models/leads';
import { ExcelDateToJSDate } from '../utils/convertExcelDateToJSDate';

const leadsToBeInserted = (latestData: any[]) => {
  const dataToInsert: (
    | {
        srNo: number;
        date: string;
        source: string;
        name: string;
        phoneNumber: string;
        email: string;
        gender: Gender;
        leadType: LeadType;
        leadTypeModified: Date;
        altPhoneNumber?: string | undefined;
        location?: string | undefined;
        course?: string | undefined;
        assignedTo?: string | undefined;
        remarks?: string | undefined;
        nextDueDate?: string | undefined;
      }
    | undefined
  )[] = [];
  latestData.map((row) => {
    try {
      if (row) {
        let leadData = {
          srNo: Number(row[0]),
          date: row[1] ? ExcelDateToJSDate(row[1]) : '',
          source: row[2] || '',
          name: row[3],
          phoneNumber: row[4],
          altPhoneNumber: row[5] || '',
          email: row[6],
          gender: Gender.NOT_TO_MENTION,
          location: row[8] || '',
          course: row[9] || '',
          assignedTo: row[10] || '',
          leadType: LeadType.ORANGE,
          remarks: row[12] || '',
          leadTypeModified: new Date(),
          nextDueDate: '00-00-0000'
        };

        if (row[13] != '') {
          const leadTypeValue = row[13] as keyof typeof LeadType;
          if (leadTypeValue && LeadType[leadTypeValue]) {
            leadData.leadType = LeadType[leadTypeValue];
          }
        }

        if (row[7] != '') {
          const genderValue = row[7] as keyof typeof Gender;
          if (genderValue && Gender[genderValue]) {
            leadData.gender = Gender[genderValue];
          }
        }

        if (row[14] && row[14] != '') {
          console.log(row[14]);
          leadData.nextDueDate = ExcelDateToJSDate(row[14]);
        }

        console.log(leadData);
        const leadDataValidation = leadSchema.safeParse(leadData);

        if (leadDataValidation.error) {
          console.log(leadDataValidation.error);
        }
        console.log('Lead Data Validation : ', leadDataValidation);
        dataToInsert.push(leadDataValidation.data);
      }
    } catch (error) {
      logger.error(`Validation failed for row: ${JSON.stringify(row)}`, error);
      return null;
    }
  });
  return dataToInsert;
};

export const saveDataToDb = async (latestData: ((string | number)[] | undefined)[]) => {
  const dataToInsert = leadsToBeInserted(latestData);

  try {
    await Lead.insertMany(dataToInsert);
    logger.info('Data entered successfully into MongoDB');
    return;
  } catch (error) {
    logger.error('Error inserting data');
    logger.error(error);
    return;
  }
};

export const uploadData = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.data?.id;
    logger.info('ID is : ', id);
    const existingUser = await User.findById(id);
    if (!existingUser) {
      res.status(404).json({ message: 'Something went wrong. Please log in again.' });
      return;
    } else {
      const isAdminOrLead =
        existingUser.roles.includes(UserRoles.ADMIN) ||
        existingUser.roles.includes(UserRoles.MARKETING_LEAD);
      if (isAdminOrLead) {
        const latestData = await readFromGoogleSheet();
        // console.log('Latest Data :', latestData);
        if (!latestData) {
          res.status(200).json({ message: 'There is no data to update :) ' });
          return;
        } else {
          await saveDataToDb(latestData);
          res.status(200).json({ message: 'Data updated in Database!' });
          return;
        }
      }
    }
  } catch (error) {
    logger.error("Couldn't fetch leads.");
    logger.error(error);
    res.status(404).json({ message: 'Error occurred in fetching leads.' });
    return;
  }
});
