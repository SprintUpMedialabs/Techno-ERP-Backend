import { google } from 'googleapis';
import { googleAuth } from './googleAuth';
import { GOOGLE_SHEET_ID, GOOGLE_SHEET_PAGE } from '../../secrets';
import logger from '../../config/logger';
import { SpreadSheetMetaData } from '../models/spreadSheet';

export const readFromGoogleSheet = async () => {
  try {
    const sheetInstance = google.sheets({ version: 'v4', auth: googleAuth });
    const spreadSheetMetaData = await SpreadSheetMetaData.findOne({});
    const lastSavedIndex = spreadSheetMetaData?.lastIdxMarketingSheet || 1;
    logger.info(`Last saved index from DB: ${lastSavedIndex}`);

    const range = `${GOOGLE_SHEET_PAGE}!A${lastSavedIndex + 1}:Z`;
    const sheetResponse = await sheetInstance.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range
    });

    const rowData = sheetResponse.data.values;
    if (!rowData || rowData.length === 0) {
      logger.info('No new data found in the sheet.');
      return;
    }

    const newLastReadIndex = lastSavedIndex + rowData.length;
    logger.info(`New Last Read Index: ${newLastReadIndex}`);

    await SpreadSheetMetaData.findOneAndUpdate(
      {},
      { lastIdxMarketingSheet: newLastReadIndex },
      { new: true, upsert: true }
    );

    console.log(rowData);

    await sheetInstance.spreadsheets.batchUpdate({
      spreadsheetId: GOOGLE_SHEET_ID,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
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
                sheetId: 0,
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

    return rowData;
  } catch (error) {
    logger.error('Error while reading from sheet', error);
    return;
  }
};
