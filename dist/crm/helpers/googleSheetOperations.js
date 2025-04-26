"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatusForMarketingSheet = exports.readFromGoogleSheet = void 0;
const googleapis_1 = require("googleapis");
const logger_1 = __importDefault(require("../../config/logger"));
const spreadSheet_1 = require("../models/spreadSheet");
const googleAuth_1 = require("./googleAuth");
const secrets_1 = require("../../secrets");
const constants_1 = require("../../config/constants");
// TODO: what if google api is down? we will focus on this on phase - 2
const readFromGoogleSheet = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const sheetInstance = googleapis_1.google.sheets({ version: 'v4', auth: googleAuth_1.googleAuth });
    const spreadSheetMetaData = yield spreadSheet_1.SpreadSheetMetaData.findOne({
        name: constants_1.MARKETING_SHEET
    });
    const lastSavedIndex = spreadSheetMetaData === null || spreadSheetMetaData === void 0 ? void 0 : spreadSheetMetaData.lastIdxMarketingSheet;
    logger_1.default.info(`Last saved index from DB: ${lastSavedIndex}`);
    const sheetMeta = yield sheetInstance.spreadsheets.get({
        spreadsheetId: secrets_1.MARKETING_SHEET_ID
    });
    const sheetInfo = (_a = sheetMeta.data.sheets) === null || _a === void 0 ? void 0 : _a.find(sheet => { var _a; return ((_a = sheet.properties) === null || _a === void 0 ? void 0 : _a.title) === secrets_1.MARKETING_SHEET_PAGE_NAME; });
    if (!sheetInfo)
        throw new Error('Sheet not found');
    const sheetId = (_b = sheetInfo.properties) === null || _b === void 0 ? void 0 : _b.sheetId;
    const currentMaxRows = (_d = (_c = sheetInfo.properties) === null || _c === void 0 ? void 0 : _c.gridProperties) === null || _d === void 0 ? void 0 : _d.rowCount;
    console.log("Sheet ID is : ", sheetId);
    console.log("Current Max Rows : ", currentMaxRows);
    // const lastSavedIndex = 804;
    const range = `${secrets_1.MARKETING_SHEET_PAGE_NAME}!A${lastSavedIndex + 1}:Z`;
    const sheetResponse = yield sheetInstance.spreadsheets.values.get({
        spreadsheetId: secrets_1.MARKETING_SHEET_ID,
        range
    });
    console.log("Temp here!");
    const rowData = sheetResponse.data.values;
    if (!rowData || rowData.length === 0) {
        logger_1.default.info('No new data found in the sheet.');
        return;
    }
    const newLastReadIndex = lastSavedIndex + rowData.length;
    logger_1.default.info(`New Last Read Index: ${newLastReadIndex}`);
    return {
        RowData: rowData,
        LastSavedIndex: lastSavedIndex
    };
});
exports.readFromGoogleSheet = readFromGoogleSheet;
const updateStatusForMarketingSheet = (newLastReadIndex, lastSavedIndex, report) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const sheetInstance = googleapis_1.google.sheets({ version: 'v4', auth: googleAuth_1.googleAuth });
    yield spreadSheet_1.SpreadSheetMetaData.findOneAndUpdate({ name: constants_1.MARKETING_SHEET }, { $set: { lastIdxMarketingSheet: newLastReadIndex } }, { new: true, upsert: true });
    const sheetMeta = yield sheetInstance.spreadsheets.get({
        spreadsheetId: secrets_1.MARKETING_SHEET_ID
    });
    const sheetInfo = (_a = sheetMeta.data.sheets) === null || _a === void 0 ? void 0 : _a.find(sheet => { var _a; return ((_a = sheet.properties) === null || _a === void 0 ? void 0 : _a.title) === secrets_1.MARKETING_SHEET_PAGE_NAME; });
    if (!sheetInfo)
        throw new Error('Sheet not found');
    const sheetId = (_b = sheetInfo.properties) === null || _b === void 0 ? void 0 : _b.sheetId;
    const currentMaxRows = (_d = (_c = sheetInfo.properties) === null || _c === void 0 ? void 0 : _c.gridProperties) === null || _d === void 0 ? void 0 : _d.rowCount;
    console.log("Sheet ID is : ", sheetId);
    console.log("Current Max Rows : ", currentMaxRows);
    const pinkRows = report.duplicateRowIds;
    const redRows1 = report.assignedToNotFound;
    const redRows2 = report.phoneNumberAndNameEmpty;
    const redRows = [...redRows1, ...redRows2];
    const requests = [
        //White
        {
            repeatCell: {
                range: {
                    sheetId,
                    startRowIndex: lastSavedIndex - 1,
                    endRowIndex: lastSavedIndex,
                },
                cell: {
                    userEnteredFormat: {
                        backgroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                    },
                },
                fields: 'userEnteredFormat.backgroundColor',
            },
        },
        //Green
        {
            repeatCell: {
                range: {
                    sheetId,
                    startRowIndex: newLastReadIndex - 1,
                    endRowIndex: newLastReadIndex,
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
    //Red
    redRows.forEach((rowIndex) => {
        requests.push({
            repeatCell: {
                range: {
                    sheetId,
                    startRowIndex: rowIndex - 1,
                    endRowIndex: rowIndex,
                },
                cell: {
                    userEnteredFormat: {
                        backgroundColor: { red: 1.0, green: 0.0, blue: 0.0 },
                    },
                },
                fields: 'userEnteredFormat.backgroundColor',
            },
        });
    });
    //Pink
    pinkRows.forEach((rowIndex) => {
        requests.push({
            repeatCell: {
                range: {
                    sheetId,
                    startRowIndex: rowIndex - 1,
                    endRowIndex: rowIndex,
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
    yield sheetInstance.spreadsheets.batchUpdate({
        spreadsheetId: secrets_1.MARKETING_SHEET_ID,
        requestBody: { requests },
    });
});
exports.updateStatusForMarketingSheet = updateStatusForMarketingSheet;
