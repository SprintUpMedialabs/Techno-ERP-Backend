import { Types } from 'mongoose';
import { User } from '../../auth/models/user';
import { DropDownType, Gender, UserRoles } from '../../config/constants';
import logger from '../../config/logger';
import { sendEmail } from '../../config/mailer';
import { LEAD_MARKETING_EMAIL } from '../../secrets';
import { MarketingsheetHeaders } from '../enums/marketingSheetHeader';
import { LeadMaster } from '../models/lead';
import { IMarketingSpreadsheetProcessReport } from '../types/marketingSpreadsheet';
import { ILeadRequest, ISheetLeadRequest, leadRequestSchema, leadSheetSchema } from '../validators/leads';
import { formatReport } from './formatReport';
import { updateStatusForMarketingSheet } from './googleSheetOperations';
import { DropDownMetaData } from '../../utilityModules/dropdown/dropDownMetaDeta';
import { formatDropdownValue, updateDropDownByType } from '../../utilityModules/dropdown/dropDownMetadataController';

const leadsToBeInserted = async (
  latestData: any[],
  report: IMarketingSpreadsheetProcessReport,
  lastSavedIndex: number,
  citySet: Set<string>,
  sourceSet: Set<string>
) => {
  let MarketingEmployees: Map<string, Types.ObjectId> = new Map();

  const dataToInsert = [];

  for (const index in latestData) {
    const row = latestData[index];

    //We need to add 1 as the sheet index starts from 1, whereas in loop, the index is starting from 0.
    const correspondingSheetIndex = lastSavedIndex + Number(index) + 1;

    try {
      if (!row) {
        logger.info('Empty row found at index : ', correspondingSheetIndex);
        report.emptyRows.push(correspondingSheetIndex);
        report.rowsFailed++;
        continue;
      }

      // if assignTo is not mentationed in sheet
      if (!row[MarketingsheetHeaders.AssignedTo]) {
        logger.info('Assigned to not found at index : ', correspondingSheetIndex);
        report.assignedToNotFound.push(correspondingSheetIndex);
        report.rowsFailed++;
        continue;
      }

      let leadData = {
        ...(row[MarketingsheetHeaders.Date] && { date: row[MarketingsheetHeaders.Date] }),
        ...(row[MarketingsheetHeaders.Source] && { source: row[MarketingsheetHeaders.Source] }),
        ...(row[MarketingsheetHeaders.Name] && { name: row[MarketingsheetHeaders.Name] }),
        ...(row[MarketingsheetHeaders.PhoneNumber] && { phoneNumber: row[MarketingsheetHeaders.PhoneNumber] }),
        ...(row[MarketingsheetHeaders.AltPhoneNumber] && { altPhoneNumber: row[MarketingsheetHeaders.AltPhoneNumber] }),
        ...(row[MarketingsheetHeaders.Email] && { email: row[MarketingsheetHeaders.Email] }),
        gender: Gender.NOT_TO_MENTION,
        ...(row[MarketingsheetHeaders.City] && { city: row[MarketingsheetHeaders.City] }),
        assignedTo: row[MarketingsheetHeaders.AssignedTo],
      };

      if (
        row[MarketingsheetHeaders.Gender] &&
        Gender[row[MarketingsheetHeaders.Gender] as keyof typeof Gender]
      ) {
        leadData.gender = Gender[row[MarketingsheetHeaders.Gender] as keyof typeof Gender];
      }

      const leadDataValidation = leadSheetSchema.safeParse(leadData);

      if (leadDataValidation.success) {
        
        if (leadDataValidation.data.phoneNumber.length == 0 && leadDataValidation.data.name.length == 0) {
          report.phoneNumberAndNameEmpty.push(correspondingSheetIndex);
          report.rowsFailed++;
          continue;
        }

        if (leadDataValidation.data.city) {
          citySet.add(formatDropdownValue(leadDataValidation.data.city));
        }
        if (leadDataValidation.data.source) {
          sourceSet.add(formatDropdownValue(leadDataValidation.data.source));
        }
        let assignedToIDs: Types.ObjectId[] = [];
        for (const assignedTo of leadDataValidation.data.assignedTo) {
          let assignedToID = MarketingEmployees.get(assignedTo);

          if (!assignedToID) {
            const existingUser = await User.findOne({ email: assignedTo });
            if (existingUser && existingUser.roles.includes(UserRoles.EMPLOYEE_MARKETING)) {
              assignedToID = existingUser._id as Types.ObjectId;
              MarketingEmployees.set(assignedTo, assignedToID);
            } else {
              if (!existingUser) {
                report.assignedToNotFound.push(correspondingSheetIndex);
              } else {
                report.unauthorizedAssignedTo.push(correspondingSheetIndex);
              }
              report.rowsFailed++;
              continue;
            }
          }
          assignedToIDs.push(assignedToID);
        }
        dataToInsert.push({ ...leadDataValidation.data, assignedTo: assignedToIDs });
      }
      else {
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
    }
    catch (error) {
      logger.error(`Error processing row: ${JSON.stringify(row)}`, error);
    }
  }

  return dataToInsert;
};

export const saveDataToDb = async (latestData: any[], lastSavedIndex: number) => {
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

  const cityDropDown = await DropDownMetaData.findOne({ type: DropDownType.CITY });
  const sourceDropDown = await DropDownMetaData.findOne({ type: DropDownType.MAKRETING_SOURCE });
  const citySet = new Set(cityDropDown?.value || []);
  const sourceSet = new Set(sourceDropDown?.value || []);

  const dataToInsert = await leadsToBeInserted(latestData, report, lastSavedIndex, citySet, sourceSet);
  if (!dataToInsert || dataToInsert.length === 0) {
    if (report.rowsFailed != 0) {
      sendEmail(LEAD_MARKETING_EMAIL, 'Lead Processing Report', formatReport(report));
      logger.info('Error report sent to Lead!');
    }
    logger.info('No valid data to insert.');

    updateStatusForMarketingSheet(lastSavedIndex + latestData.length, lastSavedIndex);
    return;
  }

  try {
    const insertedData = await LeadMaster.insertMany(dataToInsert, { ordered: false, throwOnValidationError: true });
    report.actullyProcessedRows = insertedData.length;
  } catch (error: any) {
    report.actullyProcessedRows = error.result.insertedCount;

    error.writeErrors.map((e: any) => {
      report.rowsFailed++;
      if (e.err.code === 11000) {
        report.duplicateRowIds.push(e.err.index + lastSavedIndex + 1);
      }
      else {
        report.otherIssue.push({ rowId: e.err.index + lastSavedIndex + 1, issue: e.err.errmsg });
      }
    });
  }
  if (report.rowsFailed != 0) {
    sendEmail(LEAD_MARKETING_EMAIL, 'Lead Processing Report', formatReport(report));
    logger.info('Error report sent to Lead!');
  }
  await updateDropDownByType(DropDownType.CITY, Array.from(citySet));
  await updateDropDownByType(DropDownType.MAKRETING_SOURCE, Array.from(sourceSet));
  updateStatusForMarketingSheet(lastSavedIndex + latestData.length, lastSavedIndex);
};
