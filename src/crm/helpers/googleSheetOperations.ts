import { google } from 'googleapis';
import logger from '../../config/logger';
import { SpreadSheetMetaData } from '../models/spreadSheet';
import { googleAuth } from './googleAuth';
import { MARKETING_SHEET_ID } from '../../secrets';

// TODO: what if google api is down? we will focus on this on phase - 2

export const readFromGoogleSheet = async () => {

  const sheetInstance = google.sheets({ version: 'v4', auth: googleAuth });

  const spreadSheetMetaData = await SpreadSheetMetaData.findOne({
    name: process.env.MARKETING_SHEET
  });  
  const lastSavedIndex = spreadSheetMetaData?.lastIdxMarketingSheet!;
  logger.info(`Last saved index from DB: ${lastSavedIndex}`);

  const range = `${process.env.GOOGLE_SHEET_PAGE}!A${lastSavedIndex + 1}:Z`;
  const sheetResponse = await sheetInstance.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range
  });

  const rowData = sheetResponse.data.values;
  if (!rowData || rowData.length === 0) {
    logger.info('No new data found in the sheet.');
    return;
  }

  const newLastReadIndex = lastSavedIndex + rowData.length;
  logger.info(`New Last Read Index: ${newLastReadIndex}`);

  return {
    "RowData" : rowData,
    "LastSavedIndex" : lastSavedIndex
  };
};




export const updateStatusForMarketingSheet = async (newLastReadIndex: number) => {
  const sheetInstance = google.sheets({ version: 'v4', auth: googleAuth });

  await SpreadSheetMetaData.findOneAndUpdate(
    { name: 'Marketing Sheet' },
    { $set: { lastIdxMarketingSheet: newLastReadIndex } },
    { new: true, upsert: true }
  );

  await sheetInstance.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: {
              //Sheet ID can be found using the gid in sheet url, in case if we transfer entire data from one sheet to any other sheet, and we want same functionality to exist on that other sheet, we need to update this sheet id.
              sheetId: Number(MARKETING_SHEET_ID),
              startRowIndex: 1
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: {
                  red: 1.0,
                  green: 1.0,
                  blue: 1.0
                }
              }
            },
            fields: 'userEnteredFormat.backgroundColor'
          }
        },
        {
          repeatCell: {
            range: {
              sheetId: Number(MARKETING_SHEET_ID),
              startRowIndex: newLastReadIndex - 1,
              endRowIndex: newLastReadIndex
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: {
                  red: 0.0,
                  green: 0.5019608,
                  blue: 0.0
                }
              }
            },
            fields: 'userEnteredFormat.backgroundColor'
          }
        }
      ]
    }
  });

}