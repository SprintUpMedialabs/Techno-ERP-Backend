import { Gender, UserRoles } from '../../config/constants';
import logger from '../../config/logger';
import { leadSchema } from '../validators/leads';
import { Lead } from '../models/leads';
import { User } from '../../auth/models/user';
import { IMarketingSpreadsheetProcessReport } from '../types/marketingSpreadsheet';
import { convertToMongoDate } from '../../utils/convertDateToFormatedDate';
import { MarketingsheetHeaders } from '../enums/marketingSheetHeader';
import { updateStatusForMarketingSheet } from './googleSheetOperations';
import { sendEmail } from '../../config/mailer';
import { LEAD_MARKETING_EMAIL } from '../../secrets';
import { formatReport } from './formatReport';

const leadsToBeInserted = async (
  latestData: any[],
  report: IMarketingSpreadsheetProcessReport,
  lastSavedIndex: number
) => {
  let MarketingEmployees: Map<string, string> = new Map();

  const dataToInsert: any[] = [];

  for (const index in latestData) {
    const row = latestData[index];

    //We need to add 1 as the sheet index starts from 1, whereas in loop, the index is starting from 0.
    const correspondingSheetIndex = lastSavedIndex + Number(index) + 1;

    try {
      // if assignTo is not mentationed in sheet
      if (!row[MarketingsheetHeaders.AssignedTo]) {
        logger.info('Assigned to not found at index : ', correspondingSheetIndex);
        report.assignedToNotFound.push(correspondingSheetIndex);
        report.rowsFailed++;
        continue;
      }

      if (!row) {
        logger.info('Empty row found at index : ', correspondingSheetIndex);
        report.emptyRows.push(correspondingSheetIndex);
        report.rowsFailed++;
        continue;
      }

      let assignedToEmail = row[MarketingsheetHeaders.AssignedTo];
      let assignedToID = MarketingEmployees.get(assignedToEmail);

      if (!assignedToID) {
        const existingUser = await User.findOne({ email: assignedToEmail });
        if (existingUser && existingUser.roles.includes(UserRoles.EMPLOYEE_MARKETING)) {
          assignedToID = existingUser?._id?.toString() || '';
          MarketingEmployees.set(assignedToEmail, assignedToID);
        } else {
          if (!existingUser) {
            report.otherIssue.push({
              rowId: correspondingSheetIndex,
              issue: 'Assigned to is not a valid User'
            });
          } else {
            report.otherIssue.push({
              rowId: correspondingSheetIndex,
              issue: 'Assigned to is not a Marketing Employee'
            });
            continue;
          }
        }
      }

      let leadData = {
        // TODO: it should be have some type
        date: row[MarketingsheetHeaders.Date],
        source: row[MarketingsheetHeaders.Source] || '',
        name: row[MarketingsheetHeaders.Name],
        phoneNumber: row[MarketingsheetHeaders.PhoneNumber],
        altPhoneNumber: row[MarketingsheetHeaders.AltPhoneNumber] || '',
        email: row[MarketingsheetHeaders.Email],
        gender: Gender.NOT_TO_MENTION,
        location: row[MarketingsheetHeaders.Location] || '',
        assignedTo: assignedToID
      };

      if (
        row[MarketingsheetHeaders.Gender] &&
        Gender[row[MarketingsheetHeaders.Gender] as keyof typeof Gender]
      ) {
        leadData.gender = Gender[row[MarketingsheetHeaders.Gender] as keyof typeof Gender];
      }

      const leadDataValidation = leadSchema.safeParse(leadData);

      if (leadDataValidation.success) {
        leadDataValidation.data.date = convertToMongoDate(leadDataValidation.data.date);
        dataToInsert.push(leadDataValidation.data);
      } else {
        report.rowsFailed++;
        report.otherIssue.push({
          rowId: correspondingSheetIndex,
          issue: leadDataValidation.error.errors
            .map((error) => `${error.path.join('.')}: ${error.message}`)
            .join(', ')
        });
        logger.error(
          'Validation failed for row',
          correspondingSheetIndex,
          leadDataValidation.error.errors
        );
      }
    } catch (error) {
      logger.error(`Error processing row: ${JSON.stringify(row)}`, error);
    }
  }

  return dataToInsert;
};

export const saveDataToDb = async (latestData: any[], lastSavedIndex: number) => {
  const report: IMarketingSpreadsheetProcessReport = {
    rowsToBeProcessed: latestData.length,
    otherIssue: [],
    actullyProcessedRows: 0,
    rowsFailed: 0,
    duplicateRowIds: [],
    assignedToNotFound: [],
    emptyRows: []
  };

  const dataToInsert = await leadsToBeInserted(latestData, report, lastSavedIndex);

  if (!dataToInsert || dataToInsert.length === 0) {
    if (report.rowsFailed != 0) {
      sendEmail(LEAD_MARKETING_EMAIL, 'Lead Processing Report', formatReport(report));
      logger.info('Error report sent to Lead!');
    }
    logger.info('No valid data to insert.');
    updateStatusForMarketingSheet(lastSavedIndex + latestData.length);
    return;
  }

  try {
    const data = await Lead.insertMany(dataToInsert, {
      ordered: false,
      throwOnValidationError: true
    });
    report.actullyProcessedRows = data.length;
  } catch (error: any) {
    report.actullyProcessedRows = error.result.insertedCount;

    error.writeErrors.map((e: any) => {
      report.rowsFailed++;
      if (e.err.code === 11000) {
        // console.log("Error is : ", e.err)
        report.duplicateRowIds.push(e.err.index + lastSavedIndex + 1);
      } else {
        // console.log("error is : ", e.err)
        report.otherIssue.push({ rowId: e.err.index + lastSavedIndex + 1, issue: e.err.errmsg });
      }
    });
  }

  if (report.rowsFailed != 0) {
    sendEmail(LEAD_MARKETING_EMAIL, 'Lead Processing Report', formatReport(report));
    logger.info('Error report sent to Lead!');
  }

  updateStatusForMarketingSheet(lastSavedIndex + latestData.length);
};
