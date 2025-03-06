import { google } from 'googleapis';
import { googleAuth } from './googleAuth';
import { GOOGLE_SHEET_ID, GOOGLE_SHEET_PAGE } from '../../secrets';
import logger from '../../config/logger';
import { SpreadSheetMetaData } from '../models/spreadSheet';
import { spreadSheetSchema } from '../validators/spreadSheet';
export const readFromGoogleSheet = async () => {
  try {
    const sheetInstance = google.sheets({ version: 'v4', auth: googleAuth });

    try {

      const spreadSheetMetaData = await SpreadSheetMetaData.findOne({});
      const lastSavedIndex = spreadSheetMetaData?.lastIdxMarketingSheet || 0;
      logger.info(`Last saved index from DB: ${lastSavedIndex}`);

      const range = `${GOOGLE_SHEET_PAGE}!A${lastSavedIndex}:Z`;

      const sheetInfo = sheetInstance.spreadsheets.get({
        spreadsheetId: GOOGLE_SHEET_ID,
        ranges: [range],
        fields: 'sheets.data.rowData.values(userEnteredFormat.backgroundColor,effectiveValue)',
      });

      if (sheetInfo && (await sheetInfo).data && (await sheetInfo).data.sheets) {
        const rowData = (await sheetInfo)?.data?.sheets?.[0]?.data?.[0]?.rowData;


        if (!rowData) {
          logger.info('No row formatting data found. Please check if sheet has green colors.');
          return;
        }

        let lastReadIndex = -1;

        rowData?.forEach((row, index) => {
          // console.log("Row is : ", row)
          if (
            row.values &&
            row.values[0].userEnteredFormat &&
            row.values[0].userEnteredFormat.backgroundColor
          ) {
            const bgColor = row.values[0].userEnteredFormat.backgroundColor;
            // console.log("BGCOLOR IS : ", bgColor)
            // console.log(" R is : ", bgColor.red)
            // console.log(" G is : ", bgColor.green)
            // console.log(" B is : ", bgColor.blue)
            if (bgColor && bgColor.green && bgColor.green === 0.5019608) {
              lastReadIndex = index;
              // logger.info("Last read index : ", lastReadIndex)
            }
          }
        });

        if (lastReadIndex == -1) {
          logger.info('No row found with green background color');
          return;
        }

        // console.log("Total Row DAta : ", rowData.length)

        const dataAfterLastMarked = rowData
          .slice(lastReadIndex + 1)
          .map((row) =>
            row.values?.map(
              (cell) => cell.effectiveValue?.stringValue || cell.effectiveValue?.numberValue?.toString() || ''
            )
          );

        // console.log("Data after last marked : ", dataAfterLastMarked)

        if(dataAfterLastMarked.length == 0)
        {
          logger.info("There is no new row updation, that is no update in existing db");
          return;
        }


        const newLastReadIndex = lastSavedIndex + dataAfterLastMarked.length;
        console.log("Last REad INdex  : ", lastReadIndex);
        console.log("DAta after last marked : ", dataAfterLastMarked.length);
        console.log("New Last Read Index : ", newLastReadIndex)

        await SpreadSheetMetaData.findOneAndUpdate(
          {}, 
          { lastIdxMarketingSheet: newLastReadIndex }, 
          { new : true, upsert : true}
        );


        await sheetInstance.spreadsheets.batchUpdate({
          spreadsheetId: GOOGLE_SHEET_ID,
          requestBody: {
            requests: [
              {
                repeatCell: {
                  range: {
                    sheetId: 0,
                    startRowIndex: 0,
                    endRowIndex: lastSavedIndex + 1,
                  },
                  cell: {
                    userEnteredFormat: {
                      backgroundColor: {
                        red: 1.0, 
                        green: 1.0,
                        blue: 1.0,
                      },
                    },
                  },
                  fields: 'userEnteredFormat.backgroundColor',
                },
              },
              {
                repeatCell: {
                  range: {
                    sheetId: 0,
                    startRowIndex: newLastReadIndex - 1,
                    endRowIndex: newLastReadIndex,
                  },
                  cell: {
                    userEnteredFormat: {
                      backgroundColor: {
                        red: 0.0,
                        green: 0.5019608,
                        blue: 0.0,
                      },
                    },
                  },
                  fields: 'userEnteredFormat.backgroundColor',
                },
              },
            ],
          }
        });
        return dataAfterLastMarked;
      }

    } catch (error) {
      logger.error('Error occurred : ');
      logger.error(error);
      return;
    }
  } catch (error) {
    logger.error('Error while reading from sheet');
    logger.error(error);
    return;
  }
};
