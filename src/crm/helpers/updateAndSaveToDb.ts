import { Types } from 'mongoose';
import { User } from '../../auth/models/user';
import { DropDownType, Gender, UserRoles } from '../../config/constants';
import logger from '../../config/logger';
import { sendEmail } from '../../config/mailer';
import { LEAD_MARKETING_EMAIL } from '../../secrets';
import { DropDownMetaData } from '../../utilityModules/dropdown/dropDownMetaDeta';
import { formatCapital, formatDropdownValue, updateDropDownByType } from '../../utilityModules/dropdown/dropDownMetadataController';
import { MarketingsheetHeaders } from '../enums/marketingSheetHeader';
import { LeadMaster } from '../models/lead';
import { IMarketingSpreadsheetProcessReport } from '../types/marketingSpreadsheet';
import { leadSheetSchema } from '../validators/leads';
import { formatReport } from './formatReport';
import { updateStatusForMarketingSheet } from './googleSheetOperations';
import { formatSource } from '../validators/formators';

const leadsToBeInserted = async (
  latestData: any[],
  report: IMarketingSpreadsheetProcessReport,
  lastSavedIndex: number,
  citySet: Set<string>,
  sourceSet: Set<string>,
  courseSet: Set<string>,
  requiredColumnHeaders: { [key: string]: number }
) => {
  let MarketingEmployees: Map<string, Types.ObjectId> = new Map();

  const dataToInsert = [];

  for (const index in latestData) {
    const row = latestData[index];

    //We need to add 1 as the sheet index starts from 1, whereas in loop, the index is starting from 0.
    const correspondingSheetIndex =( lastSavedIndex + Number(index) + 1) ;
    const phoneNumber = row[requiredColumnHeaders[MarketingsheetHeaders.PhoneNumber]] ?? "-";
    const name = row[requiredColumnHeaders[MarketingsheetHeaders.Name]] ?? "-";
    const date = row[requiredColumnHeaders[MarketingsheetHeaders.Date]] ?? "-";
    logger.info(`Processing row at  Date: ${date}`);

    try {
      if (!row) {
        logger.info('Empty row found at index : ', correspondingSheetIndex);
        report.emptyRows.push({rowNumber: correspondingSheetIndex, phoneNumber, name});
        report.rowsFailed++;
        continue;
      }

      // if assignTo is not mentationed in sheet
      if (!row[requiredColumnHeaders[MarketingsheetHeaders.AssignedTo]]) {
        report.assignedToNotFound.push({rowNumber: correspondingSheetIndex, phoneNumber, name});
        report.rowsFailed++;
        continue;
      }      

      let leadData = {
        ...(row[requiredColumnHeaders[MarketingsheetHeaders.Date]] && { date: row[requiredColumnHeaders[MarketingsheetHeaders.Date]] }),
        ...(row[requiredColumnHeaders[MarketingsheetHeaders.Source]] && { source: row[requiredColumnHeaders[MarketingsheetHeaders.Source]] }),
        ...(row[requiredColumnHeaders[MarketingsheetHeaders.Name]] && { name: row[requiredColumnHeaders[MarketingsheetHeaders.Name]] }),
        ...(row[requiredColumnHeaders[MarketingsheetHeaders.PhoneNumber]] && { phoneNumber: row[requiredColumnHeaders[MarketingsheetHeaders.PhoneNumber]] }),
        ...(row[requiredColumnHeaders[MarketingsheetHeaders.AltPhoneNumber]] && { altPhoneNumber: row[requiredColumnHeaders[MarketingsheetHeaders.AltPhoneNumber]] }),
        ...(row[requiredColumnHeaders[MarketingsheetHeaders.Email]] && { email: row[requiredColumnHeaders[MarketingsheetHeaders.Email]] }),
        gender: Gender.OTHER,
        ...(row[requiredColumnHeaders[MarketingsheetHeaders.City]] && { city: row[requiredColumnHeaders[MarketingsheetHeaders.City]] }),
        ...(row[requiredColumnHeaders[MarketingsheetHeaders.LeadType]] && { leadType: row[requiredColumnHeaders[MarketingsheetHeaders.LeadType]] }),
        ...(row[requiredColumnHeaders[MarketingsheetHeaders.Remarks]] && { remarks: row[requiredColumnHeaders[MarketingsheetHeaders.Remarks]] }),
        ...(row[requiredColumnHeaders[MarketingsheetHeaders.SchoolName]] && { schoolName: row[requiredColumnHeaders[MarketingsheetHeaders.SchoolName]] }),
        ...(row[requiredColumnHeaders[MarketingsheetHeaders.Area]] && { area: row[requiredColumnHeaders[MarketingsheetHeaders.Area]] }),
        ...(row[requiredColumnHeaders[MarketingsheetHeaders.Course]] && { course: row[requiredColumnHeaders[MarketingsheetHeaders.Course]] }),
        assignedTo: row[requiredColumnHeaders[MarketingsheetHeaders.AssignedTo]],
        ...(row[requiredColumnHeaders[MarketingsheetHeaders.Degree]] && { degree: row[requiredColumnHeaders[MarketingsheetHeaders.Degree]] }),
      };

      row[requiredColumnHeaders[MarketingsheetHeaders.Gender]] = row[requiredColumnHeaders[MarketingsheetHeaders.Gender]]?.toUpperCase();
      if (
        row[requiredColumnHeaders[MarketingsheetHeaders.Gender]] &&
        Gender[row[requiredColumnHeaders[MarketingsheetHeaders.Gender]] as keyof typeof Gender]
      ) {
        leadData.gender = Gender[row[requiredColumnHeaders[MarketingsheetHeaders.Gender]] as keyof typeof Gender];
      }

      if (row[requiredColumnHeaders[MarketingsheetHeaders.Remarks]]) {
        leadData.followUpCount = 1;
      }

      if(!row[requiredColumnHeaders[MarketingsheetHeaders.LeadType]]) {
        leadData.leadType = "LEFT_OVER";
      }

      const leadDataValidation = leadSheetSchema.safeParse(leadData);

      if (leadDataValidation.success) {

        if (leadDataValidation.data.phoneNumber.length == 0 && leadDataValidation.data.name.length == 0) {
          report.phoneNumberAndNameEmpty.push({rowNumber: correspondingSheetIndex, phoneNumber: phoneNumber, name});
          report.rowsFailed++;
          continue;
        }

        if (leadDataValidation.data.city) {
          citySet.add(formatDropdownValue(leadDataValidation.data.city));
        }
        if (leadDataValidation.data.source) {
          sourceSet.add(formatSource(leadDataValidation.data.source));
        }
        if (leadDataValidation.data.course) {
          courseSet.add(formatCapital(leadDataValidation.data.course));
        }

        for (const assignedTo of leadDataValidation.data.assignedTo) {
          let assignedToID = MarketingEmployees.get(assignedTo);

          if (!assignedToID) {
            const existingUser = await User.findOne({ email: assignedTo });
            if (existingUser && existingUser.roles.includes(UserRoles.EMPLOYEE_MARKETING)) {
              assignedToID = existingUser._id as Types.ObjectId;
              MarketingEmployees.set(assignedTo, assignedToID);
            } else {
              if (!existingUser) {
                report.assignedToNotFound.push({rowNumber: correspondingSheetIndex, phoneNumber, name});
                report.rowsFailed++;
              } else {
                report.unauthorizedAssignedTo.push({rowNumber: correspondingSheetIndex, phoneNumber, name});
                report.rowsFailed++;
              }
              continue;
            }
          }
          dataToInsert.push({ ...leadDataValidation.data, assignedTo: assignedToID });
        }
      }
      else {
        report.rowsFailed++;
        report.otherIssue.push({
          rowNumber: correspondingSheetIndex,
          issue: leadDataValidation.error.errors
            .map((error) => `${error.path.join('.')}: ${error.message}`)
            .join(', '),
          phoneNumber,
          name
        });
        logger.error(
          'Validation failed for row',
          correspondingSheetIndex,
          leadDataValidation.error.errors
        );
      }
    }
    catch (error) {
      logger.error(`Error processing row: ${JSON.stringify(row)}`, error);
    }
  }

  return dataToInsert;
};

export const saveDataToDb = async (latestData: any[], lastSavedIndex: number, sheetId: string, sheetName: string, requiredColumnHeaders: { [key: string]: number }) => {
  const report: IMarketingSpreadsheetProcessReport = {
    rowsToBeProcessed: latestData.length,
    actullyProcessedRows: 0,
    rowsFailed: 0,
    duplicateRowIds: [],
    assignedToNotFound: [],
    otherIssue: [],
    emptyRows: [],
    phoneNumberAndNameEmpty: [],
    unauthorizedAssignedTo: [],
    invalidPhoneNumber: [],
  };

  const cityDropDown = await DropDownMetaData.findOne({ type: DropDownType.MARKETING_CITY });
  const sourceDropDown = await DropDownMetaData.findOne({ type: DropDownType.MARKETING_SOURCE });
  const courseDropDown = await DropDownMetaData.findOne({ type: DropDownType.MARKETING_COURSE_CODE });
  const citySet = new Set(cityDropDown?.value || []);
  const sourceSet = new Set(sourceDropDown?.value || []);
  const courseSet = new Set(courseDropDown?.value || []);

  const dataToInsert = await leadsToBeInserted(latestData, report, lastSavedIndex, citySet, sourceSet, courseSet, requiredColumnHeaders);
  if (!dataToInsert || dataToInsert.length === 0) {
    if (report.rowsFailed != 0) {
      sendEmail(LEAD_MARKETING_EMAIL, 'Lead Processing Report', formatReport(report));
      logger.info('Error report sent to Lead!');
    }
    logger.info('No valid data to insert.');

    updateStatusForMarketingSheet(lastSavedIndex + latestData.length, lastSavedIndex, report, sheetId, sheetName);
    return;
  }
  try {
    const insertedData = await LeadMaster.insertMany(dataToInsert, { ordered: false, throwOnValidationError: true });
    report.actullyProcessedRows = insertedData.length;
  } catch (error: any) {
    try {
      report.actullyProcessedRows = error.result.insertedCount;
      for (const e of error.writeErrors) {
        report.rowsFailed++;
        if (e.err.code === 11000) {
          report.duplicateRowIds.push({ rowNumber: e.err.index + lastSavedIndex + 1, phoneNumber: latestData[e.err.index][requiredColumnHeaders[MarketingsheetHeaders.PhoneNumber]] || '', name: latestData[e.err.index][requiredColumnHeaders[MarketingsheetHeaders.Name]] || '' });
        }
        else {
          report.otherIssue.push({ rowNumber: e.err.index + lastSavedIndex + 1, issue: e.err.errmsg, phoneNumber: latestData[e.err.index][requiredColumnHeaders[MarketingsheetHeaders.PhoneNumber]] || '' , name: latestData[e.err.index][requiredColumnHeaders[MarketingsheetHeaders.Name]] || '' });
        }
      }
    } catch (error) {
      logger.error(`Error processing rows: ${JSON.stringify(error)}`);
    }
  }
  if (report.rowsFailed != 0) {
    sendEmail(LEAD_MARKETING_EMAIL, 'Lead Processing Report', formatReport(report));
    logger.info('Error report sent to Lead!');
  }
  updateDropDownByType(DropDownType.MARKETING_CITY, Array.from(citySet));
  updateDropDownByType(DropDownType.MARKETING_SOURCE, Array.from(sourceSet));
  updateDropDownByType(DropDownType.MARKETING_COURSE_CODE, Array.from(courseSet));

  updateStatusForMarketingSheet(lastSavedIndex + latestData.length, lastSavedIndex, report, sheetId, sheetName);
};