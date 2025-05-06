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
const marketingSheetHeader_1 = require("../enums/marketingSheetHeader");
const spreadSheet_1 = require("../models/spreadSheet");
const googleAuth_1 = require("./googleAuth");
// TODO: what if google api is down? we will focus on this on phase - 2
const readFromGoogleSheet = (MARKETING_SHEET_ID, MARKETING_SHEET_PAGE_NAME) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const sheetInstance = googleapis_1.google.sheets({ version: 'v4', auth: googleAuth_1.googleAuth });
    let spreadSheetMetaData = yield spreadSheet_1.SpreadSheetMetaData.findOne({
        name: MARKETING_SHEET_PAGE_NAME
    });
    spreadSheetMetaData !== null && spreadSheetMetaData !== void 0 ? spreadSheetMetaData : (spreadSheetMetaData = yield spreadSheet_1.SpreadSheetMetaData.create({
        name: MARKETING_SHEET_PAGE_NAME,
        lastIdxMarketingSheet: 1
    }));
    const lastSavedIndex = spreadSheetMetaData.lastIdxMarketingSheet;
    logger_1.default.info(`Last saved index from DB: ${lastSavedIndex}`);
    const sheetMeta = yield sheetInstance.spreadsheets.get({
        spreadsheetId: MARKETING_SHEET_ID
    });
    const sheetInfo = (_a = sheetMeta.data.sheets) === null || _a === void 0 ? void 0 : _a.find(sheet => { var _a; return ((_a = sheet.properties) === null || _a === void 0 ? void 0 : _a.title) === MARKETING_SHEET_PAGE_NAME; });
    if (!sheetInfo)
        throw new Error('Sheet not found');
    const range = `${MARKETING_SHEET_PAGE_NAME}!A${lastSavedIndex + 1}:Z`;
    const sheetResponse = yield sheetInstance.spreadsheets.values.get({
        spreadsheetId: MARKETING_SHEET_ID,
        range
    });
    const rowData = sheetResponse.data.values;
    if (!rowData || rowData.length === 0) {
        logger_1.default.info('No new data found in the sheet.');
        return;
    }
    const headerResponse = yield sheetInstance.spreadsheets.values.get({
        spreadsheetId: MARKETING_SHEET_ID,
        range: `${MARKETING_SHEET_PAGE_NAME}!A1:Z1`
    });
    const columnHeaders = ((_b = headerResponse.data.values) === null || _b === void 0 ? void 0 : _b[0]) || [];
    const requiredColumnHeaderWithIndex = {};
    Object.values(marketingSheetHeader_1.MarketingsheetHeaders).forEach((header) => {
        requiredColumnHeaderWithIndex[header] = columnHeaders.indexOf(header);
    });
    const newLastReadIndex = lastSavedIndex + rowData.length;
    logger_1.default.info(`New Last Read Index: ${newLastReadIndex}`);
    return {
        requiredColumnHeaders: requiredColumnHeaderWithIndex,
        rowData: rowData,
        lastSavedIndex: lastSavedIndex
    };
});
exports.readFromGoogleSheet = readFromGoogleSheet;
const updateStatusForMarketingSheet = (newLastReadIndex, lastSavedIndex, report, MARKETING_SHEET_ID, MARKETING_SHEET_PAGE_NAME) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const sheetInstance = googleapis_1.google.sheets({ version: 'v4', auth: googleAuth_1.googleAuth });
    newLastReadIndex = newLastReadIndex + 1;
    yield spreadSheet_1.SpreadSheetMetaData.findOneAndUpdate({ name: MARKETING_SHEET_PAGE_NAME }, { $set: { lastIdxMarketingSheet: newLastReadIndex } }, { new: true, upsert: true });
    const sheetMeta = yield sheetInstance.spreadsheets.get({
        spreadsheetId: MARKETING_SHEET_ID
    });
    const sheetInfo = (_a = sheetMeta.data.sheets) === null || _a === void 0 ? void 0 : _a.find(sheet => { var _a; return ((_a = sheet.properties) === null || _a === void 0 ? void 0 : _a.title) === MARKETING_SHEET_PAGE_NAME; });
    if (!sheetInfo)
        throw new Error('Sheet not found');
    const sheetId = (_b = sheetInfo.properties) === null || _b === void 0 ? void 0 : _b.sheetId;
    const pinkRows = report.duplicateRowIds;
    const redRows1 = report.assignedToNotFound;
    const redRows2 = report.phoneNumberAndNameEmpty;
    const redRows = [...redRows1, ...redRows2];
    const requests = [
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
    //Blue
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
        spreadsheetId: MARKETING_SHEET_ID,
        requestBody: { requests },
    });
});
exports.updateStatusForMarketingSheet = updateStatusForMarketingSheet;
