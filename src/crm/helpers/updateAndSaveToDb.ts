import { Gender, LeadType, UserRoles } from '../../config/constants';
import logger from '../../config/logger';
import { leadSchema } from '../validators/leads';
import { Lead } from '../models/leads';
import { ExcelDateToJSDate } from '../utils/convertExcelDateToJSDate';
import { User } from '../../auth/models/user';

const leadsToBeInserted = async (latestData: any[]) => {
  let MarketingEmployees: Map<string, string> = new Map();
  const dataToInsert: any[] = [];

  for (const row of latestData) {
    try {
      if (!row || !row[10]) continue;

      // console.log("row[10] is : ", row[10]);
      let assignedToEmail = row[10];
      let assignedToID = MarketingEmployees.get(assignedToEmail);

      if (!assignedToID) {
        const existingUser = await User.findOne({ email: assignedToEmail });
        if (existingUser && existingUser.roles.includes(UserRoles.EMPLOYEE_MARKETING)) {
          assignedToID = existingUser?._id?.toString() || "";
          MarketingEmployees.set(assignedToEmail, assignedToID);
        }
      }

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
        assignedTo: assignedToID,
        leadType: LeadType.ORANGE,
        remarks: row[12] || '',
        leadTypeModified: new Date().toISOString(),
        nextDueDate: '00-00-0000'
      };

      if (row[13] && LeadType[row[13] as keyof typeof LeadType]) {
        leadData.leadType = LeadType[row[13] as keyof typeof LeadType];
      }

      if (row[7] && Gender[row[7] as keyof typeof Gender]) {
        leadData.gender = Gender[row[7] as keyof typeof Gender];
      }

      if (row[14]) {
        leadData.nextDueDate = ExcelDateToJSDate(row[14]);
      }

      const leadDataValidation = leadSchema.safeParse(leadData);
      if (leadDataValidation.success) {
        dataToInsert.push(leadDataValidation.data);
      } else {
        console.error("Validation failed for row", row, leadDataValidation.error);
      }
    } catch (error) {
      logger.error(`Error processing row: ${JSON.stringify(row)}`, error);
    }
  }
  
  // console.log("Data to insert:", dataToInsert);
  return dataToInsert;
};

export const saveDataToDb = async (latestData: any[]) => {
  const dataToInsert = await leadsToBeInserted(latestData);

  if (!dataToInsert || dataToInsert.length === 0) {
    logger.info("No valid data to insert.");
    return;
  }

  try {
    await Lead.insertMany(dataToInsert);
    logger.info('Data successfully inserted into MongoDB');
  } catch (error) {
    logger.error('Error inserting data:', error);
  }
};