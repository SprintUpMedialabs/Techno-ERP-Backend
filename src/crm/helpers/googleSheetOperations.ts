import { google } from 'googleapis';
import logger from '../../config/logger';
import { MarketingsheetHeaders } from '../enums/marketingSheetHeader';
import { SpreadSheetMetaData } from '../models/spreadSheet';
import { IMarketingSpreadsheetProcessReport } from '../types/marketingSpreadsheet';
import { googleAuth } from './googleAuth';

// TODO: what if google api is down? we will focus on this on phase - 2

export const readFromGoogleSheet = async (MARKETING_SHEET_ID: string, MARKETING_SHEET_PAGE_NAME: string) => {
  const sheetInstance = google.sheets({ version: 'v4', auth: googleAuth });

  let spreadSheetMetaData = await SpreadSheetMetaData.findOne({
    name: MARKETING_SHEET_PAGE_NAME
  });

  spreadSheetMetaData ??= await SpreadSheetMetaData.create({
    name: MARKETING_SHEET_PAGE_NAME,
    lastIdxMarketingSheet: 1
  });

  const lastSavedIndex = spreadSheetMetaData.lastIdxMarketingSheet;

  logger.info(`Last saved index from DB: ${lastSavedIndex}`);
  console.log( MARKETING_SHEET_ID)
  console.log(MARKETING_SHEET_PAGE_NAME)
  const sheetMeta = await sheetInstance.spreadsheets.get({
    spreadsheetId: MARKETING_SHEET_ID
  });

  const sheetInfo = sheetMeta.data.sheets?.find(
    sheet => sheet.properties?.title === MARKETING_SHEET_PAGE_NAME
  );

  if (!sheetInfo) throw new Error('Sheet not found');

  const range = `${MARKETING_SHEET_PAGE_NAME}!A${lastSavedIndex + 1}:Z`;
  const sheetResponse = await sheetInstance.spreadsheets.values.get({
    spreadsheetId: MARKETING_SHEET_ID,
    range
  });

  const rowData = sheetResponse.data.values;
  if (!rowData || rowData.length === 0) {
    logger.info('No new data found in the sheet.');
    return;
  }

  const headerResponse = await sheetInstance.spreadsheets.values.get({
    spreadsheetId: MARKETING_SHEET_ID,
    range: `${MARKETING_SHEET_PAGE_NAME}!A1:Z1`
  });
  const columnHeaders = headerResponse.data.values?.[0] || [];

  const lowerCaseColumnHeaders = columnHeaders.map(header => header.toLowerCase());

  const requiredColumnHeaderWithIndex: { [key: string]: number } = {};

  Object.values(MarketingsheetHeaders).forEach((header) => {
    const index = lowerCaseColumnHeaders.indexOf(header.toLowerCase());
    requiredColumnHeaderWithIndex[header] = index;
  });

  const newLastReadIndex = lastSavedIndex + rowData.length;
  logger.info(`New Last Read Index: ${newLastReadIndex}`);

  return {
    requiredColumnHeaders: requiredColumnHeaderWithIndex,
    rowData: rowData,
    lastSavedIndex: lastSavedIndex
  };
};

export const updateStatusForMarketingSheet = async (newLastReadIndex: number, lastSavedIndex: number, report: IMarketingSpreadsheetProcessReport, MARKETING_SHEET_ID: string, MARKETING_SHEET_PAGE_NAME: string) => {
  const sheetInstance = google.sheets({ version: 'v4', auth: googleAuth });

  await SpreadSheetMetaData.findOneAndUpdate(
    { name: MARKETING_SHEET_PAGE_NAME },
    { $set: { lastIdxMarketingSheet: newLastReadIndex } },
    { new: true, upsert: true }
  );

  const sheetMeta = await sheetInstance.spreadsheets.get({
    spreadsheetId: MARKETING_SHEET_ID
  });

  const sheetInfo = sheetMeta.data.sheets?.find(
    sheet => sheet.properties?.title === MARKETING_SHEET_PAGE_NAME
  );

  if (!sheetInfo) throw new Error('Sheet not found');

  const sheetId = sheetInfo.properties?.sheetId!;

  const pinkRows = report.duplicateRowIds;
  const redRows1 = report.assignedToNotFound;
  const redRows2 = report.phoneNumberAndNameEmpty;
  const redRows = [...redRows1, ...redRows2];

  const requests: any[] = [
    //Green
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: newLastReadIndex - 1,
          endRowIndex: newLastReadIndex,
          startColumnIndex: 0,
          endColumnIndex: 2
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.0, green: 0.5019608, blue: 0.0 },
          },
        },
        fields: 'userEnteredFormat.backgroundColor',
      },
    },
  ];

  //Blue
  redRows.forEach((rowIndex) => {
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: rowIndex - 1,
          endRowIndex: rowIndex,
          startColumnIndex: 0,
          endColumnIndex: 2
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.7, green: 0.85, blue: 1.0 }
          },
        },
        fields: 'userEnteredFormat.backgroundColor',
      },
    });
  });

  if (lastSavedIndex > 1) {
    requests.push({
      //Orange
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: lastSavedIndex - 1,
          endRowIndex: lastSavedIndex,
          startColumnIndex: 0,
          endColumnIndex: 2
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 1.0, green: 0.5, blue: 0.0 }
          },
        },
        fields: 'userEnteredFormat.backgroundColor',
      },
    });
  }

  //Pink
  pinkRows.forEach((rowIndex) => {
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: rowIndex - 1,
          endRowIndex: rowIndex,
          startColumnIndex: 0,
          endColumnIndex: 2
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 1.0, green: 0.8, blue: 0.9 },
          },
        },
        fields: 'userEnteredFormat.backgroundColor',
      },
    });
  });

  await sheetInstance.spreadsheets.batchUpdate({
    spreadsheetId: MARKETING_SHEET_ID,
    requestBody: { requests },
  });

};
