import { Gender, LeadType, UserRoles } from '../../config/constants';
import logger from '../../config/logger';
import { leadSchema } from '../validators/leads';
import { Lead } from '../models/leads';
import { User } from '../../auth/models/user';
import { IMarketingSpreadsheetProcessReport } from '../types/marketingSpreadsheet';
import { sendEmail } from '../../config/mailer';
import { convertToMongoDate } from '../../utils/convertDateToFormatedDate';
import { MarketingsheetHeaders } from '../enums/marketingSheetHeader';
import { SpreadSheetMetaData } from '../models/spreadSheet';
import { updateStatusForMarketingSheet } from './googleSheetOperations';

const leadsToBeInserted = async (latestData: any[], report: IMarketingSpreadsheetProcessReport) => {
  let MarketingEmployees: Map<string, string> = new Map();
  const dataToInsert: any[] = [];

  for (const row of latestData) {
    try {
      // if assignTo is not mentationed in sheet
      if (!row[MarketingsheetHeaders.AssignedTo]) {
        report.assignedToNotFound.push(row[0]); //TODO: need to have something from our side as srNo is no longer there
        continue;
      }

      if (!row) {
        report.emptyRows.push(row[0]); //TODO: need to have something from our side as srNo is no longer there
        continue;
      }

      // console.log("row[10] is : ", row[10]);
      let assignedToEmail = row[MarketingsheetHeaders.AssignedTo];
      let assignedToID = MarketingEmployees.get(assignedToEmail);

      if (!assignedToID) {
        const existingUser = await User.findOne({ email: assignedToEmail });
        if (existingUser && existingUser.roles.includes(UserRoles.EMPLOYEE_MARKETING)) {
          assignedToID = existingUser?._id?.toString() || '';
          MarketingEmployees.set(assignedToEmail, assignedToID);
        } else {
          if (!existingUser) {
            report.otherIssue.push({ rowId: row[0], issue: 'Assigned to is not a valid User' }); //TODO: need to have something from our side as srNo is no longer there
          } else {
            report.otherIssue.push({
              rowId: row[0],
              issue: 'Assigned to is not a Marketing Employee'
            }); //TODO: need to have something from our side as srNo is no longer there
            continue;
          }
        }
      }

      let leadData = {  // TODO: it should be have some type 
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

      if (row[MarketingsheetHeaders.Gender] && Gender[row[MarketingsheetHeaders.Gender] as keyof typeof Gender]) {
        leadData.gender = Gender[row[MarketingsheetHeaders.Gender] as keyof typeof Gender];
      }

      const leadDataValidation = leadSchema.safeParse(leadData);
      if (leadDataValidation.success) {
        leadDataValidation.data.date = convertToMongoDate(leadDataValidation.data.date);
        dataToInsert.push(leadDataValidation.data);
      } else {
        report.rowsFailed++;
        report.otherIssue.push({
          rowId: row[0],
          issue: leadDataValidation.error.errors
            .map((error) => `${error.path.join('.')}: ${error.message}`)
            .join(', ')
        }); //TODO: need to have something from our side as srNo is no longer there
        logger.error('Validation failed for row', row, leadDataValidation.error.errors);
      }
    } catch (error) {
      logger.error(`Error processing row: ${JSON.stringify(row)}`, error);
    }
  }

  return dataToInsert;
};

const formatReport = (report: IMarketingSpreadsheetProcessReport): string => {
  return `
    <h2>Lead Processing Report</h2>
    <p><strong>Total Rows Processed:</strong> ${report.rowsToBeProcessed}</p>
    <p><strong>Successfully Processed:</strong> ${report.actullyProcessedRows}</p>
    <p><strong>Rows Failed:</strong> ${report.rowsFailed}</p>
    
    ${report.duplicateRowIds.length > 0
      ? `
      <h3>Duplicate Rows</h3>
      <ul>${report.duplicateRowIds.map((id) => `<li>Row ID: ${id}</li>`).join('')}</ul>
    `
      : ''
    }

    ${report.assignedToNotFound.length > 0
      ? `
      <h3>Rows with Missing Assigned Users</h3>
      <ul>${report.assignedToNotFound.map((id) => `<li>Row ID: ${id}</li>`).join('')}</ul>
    `
      : ''
    }

    ${report.emptyRows.length > 0
      ? `
      <h3>Empty Rows</h3>
      <ul>${report.emptyRows.map((id) => `<li>Row ID: ${id}</li>`).join('')}</ul>
    `
      : ''
    }

    ${report.otherIssue.length > 0
      ? `
      <h3>Other Issues</h3>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr>
          <th>Row ID</th>
          <th>Issue</th>
        </tr>
        ${report.otherIssue
        .map(
          (issue) => `
          <tr>
            <td>${issue.rowId}</td>
            <td>${issue.issue}</td>
          </tr>
        `
        )
        .join('')}
      </table>
    `
      : ''
    }
  `;
};

// TODO: we need report after completing batch update
export const saveDataToDb = async (latestData: any[]) => {
  const report: IMarketingSpreadsheetProcessReport = {
    rowsToBeProcessed: latestData.length,
    otherIssue: [],
    actullyProcessedRows: 0,
    rowsFailed: 0,
    duplicateRowIds: [],
    assignedToNotFound: [],
    emptyRows: []
  };

  const dataToInsert = await leadsToBeInserted(latestData, report);

  if (!dataToInsert || dataToInsert.length === 0) {
    // TODO: uncmnt this
    // if (report.rowsFailed != 0) {
    //   sendEmail(process.env.LEAD_MARKETING_EMAIL!, 'Lead Processing Report', formatReport(report));
    // }
    logger.info('No valid data to insert.');
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
        report.duplicateRowIds.push(e.err.op.srNo); // TODO: need to change this to row number
      } else {
        report.otherIssue.push({ rowId: e.err.op.srNo, issue: e.err.errmsg }); // TODO: need to change this to row number
      }
    });
    // TODO: uncmet this
    // if (report.rowsFailed != 0) {
    //   sendEmail(process.env.LEAD_MARKETING_EMAIL!, 'Lead Processing Report', formatReport(report));
    // }
    // TODO: need to have proper log here
  }
  const lastSavedIndex = spreadSheetMetaData?.lastIdxMarketingSheet!;
  
  const spreadSheetMetaData = await SpreadSheetMetaData.findOneAndUpdate({
    name: process.env.MARKETING_SHEET
  }, {
    lastIdxMarketingSheet: lastSavedIndex
  });

  updateStatusForMarketingSheet(lastSavedIndex + latestData.length)
};
