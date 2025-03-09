import { google } from 'googleapis';
import logger from '../../config/logger';
import { SpreadSheetMetaData } from '../models/spreadSheet';
import { googleAuth } from './googleAuth';

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

  // TODO: uncomment this after testing
  // await SpreadSheetMetaData.findOneAndUpdate(
  //   { name: 'Marketing Sheet' },
  //   { $set: { lastIdxMarketingSheet: newLastReadIndex } },
  //   { new: true, upsert: true }
  // );

  // console.log(rowData);

  // await sheetInstance.spreadsheets.batchUpdate({
  //   spreadsheetId: process.env.GOOGLE_SHEET_ID,
  //   requestBody: {
  //     requests: [
  //       {
  //         repeatCell: {
  //           range: {
  //             sheetId: 0,
  //             startRowIndex: 1
  //           },
  //           cell: {
  //             userEnteredFormat: {
  //               backgroundColor: {
  //                 red: 1.0,
  //                 green: 1.0,
  //                 blue: 1.0
  //               }
  //             }
  //           },
  //           fields: 'userEnteredFormat.backgroundColor'
  //         }
  //       },
  //       {
  //         repeatCell: {
  //           range: {
  //             sheetId: 0,
  //             startRowIndex: newLastReadIndex - 1,
  //             endRowIndex: newLastReadIndex
  //           },
  //           cell: {
  //             userEnteredFormat: {
  //               backgroundColor: {
  //                 red: 0.0,
  //                 green: 0.5019608,
  //                 blue: 0.0
  //               }
  //             }
  //           },
  //           fields: 'userEnteredFormat.backgroundColor'
  //         }
  //       }
  //     ]
  //   }
  // });

  return rowData;
};


export const updateStatusForMarketingSheet = async (newLastReadIndex: number) => {
  const sheetInstance = google.sheets({ version: 'v4', auth: googleAuth });
  // TODO: uncomment this after testing
  await SpreadSheetMetaData.findOneAndUpdate(
    { name: 'Marketing Sheet' },
    { $set: { lastIdxMarketingSheet: newLastReadIndex } },
    { new: true, upsert: true }
  );

  // console.log(rowData);

  await sheetInstance.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
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

}