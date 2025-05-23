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
exports.saveDataToDb = void 0;
const user_1 = require("../../auth/models/user");
const constants_1 = require("../../config/constants");
const logger_1 = __importDefault(require("../../config/logger"));
const mailer_1 = require("../../config/mailer");
const secrets_1 = require("../../secrets");
const dropDownMetaDeta_1 = require("../../utilityModules/dropdown/dropDownMetaDeta");
const dropDownMetadataController_1 = require("../../utilityModules/dropdown/dropDownMetadataController");
const marketingSheetHeader_1 = require("../enums/marketingSheetHeader");
const lead_1 = require("../models/lead");
const leads_1 = require("../validators/leads");
const formatReport_1 = require("./formatReport");
const googleSheetOperations_1 = require("./googleSheetOperations");
const leadsToBeInserted = (latestData, report, lastSavedIndex, citySet, sourceSet, courseSet, requiredColumnHeaders) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let MarketingEmployees = new Map();
    const dataToInsert = [];
    for (const index in latestData) {
        const row = latestData[index];
        //We need to add 1 as the sheet index starts from 1, whereas in loop, the index is starting from 0.
        const correspondingSheetIndex = lastSavedIndex + Number(index) + 1;
        try {
            if (!row) {
                logger_1.default.info('Empty row found at index : ', correspondingSheetIndex);
                report.emptyRows.push(correspondingSheetIndex);
                report.rowsFailed++;
                continue;
            }
            // if assignTo is not mentationed in sheet
            if (!row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.AssignedTo]]) {
                // logger.info('Assigned to not found at index : ', correspondingSheetIndex);
                report.assignedToNotFound.push(correspondingSheetIndex);
                report.rowsFailed++;
                continue;
            }
            let leadData = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.Date]] && { date: row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.Date]] })), (row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.Source]] && { source: row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.Source]] })), (row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.Name]] && { name: row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.Name]] })), (row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.PhoneNumber]] && { phoneNumber: row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.PhoneNumber]] })), (row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.AltPhoneNumber]] && { altPhoneNumber: row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.AltPhoneNumber]] })), (row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.Email]] && { email: row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.Email]] })), { gender: constants_1.Gender.OTHER }), (row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.City]] && { city: row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.City]] })), (row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.LeadType]] && { leadType: row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.LeadType]] })), (row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.Remarks]] && { remarks: row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.Remarks]] })), (row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.SchoolName]] && { schoolName: row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.SchoolName]] })), (row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.Area]] && { area: row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.Area]] })), (row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.Course]] && { course: row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.Course]] })), { assignedTo: row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.AssignedTo]] });
            row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.Gender]] = (_a = row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.Gender]]) === null || _a === void 0 ? void 0 : _a.toUpperCase();
            if (row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.Gender]] &&
                constants_1.Gender[row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.Gender]]]) {
                leadData.gender = constants_1.Gender[row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.Gender]]];
            }
            if (row[requiredColumnHeaders[marketingSheetHeader_1.MarketingsheetHeaders.Remarks]]) {
                leadData.followUpCount = 1;
            }
            console.log(leadData);
            const leadDataValidation = leads_1.leadSheetSchema.safeParse(leadData);
            if (leadDataValidation.success) {
                if (leadDataValidation.data.phoneNumber.length == 0 && leadDataValidation.data.name.length == 0) {
                    report.phoneNumberAndNameEmpty.push(correspondingSheetIndex);
                    report.rowsFailed++;
                    continue;
                }
                if (leadDataValidation.data.city) {
                    citySet.add((0, dropDownMetadataController_1.formatDropdownValue)(leadDataValidation.data.city));
                }
                if (leadDataValidation.data.source) {
                    sourceSet.add((0, dropDownMetadataController_1.formatDropdownValue)(leadDataValidation.data.source));
                }
                if (leadDataValidation.data.course) {
                    courseSet.add((0, dropDownMetadataController_1.formatCapital)(leadDataValidation.data.course));
                }
                let assignedToIDs = [];
                for (const assignedTo of leadDataValidation.data.assignedTo) {
                    let assignedToID = MarketingEmployees.get(assignedTo);
                    if (!assignedToID) {
                        const existingUser = yield user_1.User.findOne({ email: assignedTo });
                        if (existingUser && existingUser.roles.includes(constants_1.UserRoles.EMPLOYEE_MARKETING)) {
                            assignedToID = existingUser._id;
                            MarketingEmployees.set(assignedTo, assignedToID);
                        }
                        else {
                            if (!existingUser) {
                                report.assignedToNotFound.push(correspondingSheetIndex);
                            }
                            else {
                                report.unauthorizedAssignedTo.push(correspondingSheetIndex);
                            }
                            report.rowsFailed++;
                            continue;
                        }
                    }
                    assignedToIDs.push(assignedToID);
                }
                dataToInsert.push(Object.assign(Object.assign({}, leadDataValidation.data), { assignedTo: assignedToIDs }));
            }
            else {
                report.rowsFailed++;
                report.otherIssue.push({
                    rowId: correspondingSheetIndex,
                    issue: leadDataValidation.error.errors
                        .map((error) => `${error.path.join('.')}: ${error.message}`)
                        .join(', ')
                });
                logger_1.default.error('Validation failed for row', correspondingSheetIndex, leadDataValidation.error.errors);
            }
        }
        catch (error) {
            logger_1.default.error(`Error processing row: ${JSON.stringify(row)}`, error);
        }
    }
    return dataToInsert;
});
const saveDataToDb = (latestData, lastSavedIndex, sheetId, sheetName, requiredColumnHeaders) => __awaiter(void 0, void 0, void 0, function* () {
    const report = {
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
    const cityDropDown = yield dropDownMetaDeta_1.DropDownMetaData.findOne({ type: constants_1.DropDownType.MARKETING_CITY });
    const sourceDropDown = yield dropDownMetaDeta_1.DropDownMetaData.findOne({ type: constants_1.DropDownType.MARKETING_SOURCE });
    const courseDropDown = yield dropDownMetaDeta_1.DropDownMetaData.findOne({ type: constants_1.DropDownType.MARKETING_COURSE_CODE });
    const citySet = new Set((cityDropDown === null || cityDropDown === void 0 ? void 0 : cityDropDown.value) || []);
    const sourceSet = new Set((sourceDropDown === null || sourceDropDown === void 0 ? void 0 : sourceDropDown.value) || []);
    const courseSet = new Set((courseDropDown === null || courseDropDown === void 0 ? void 0 : courseDropDown.value) || []);
    const dataToInsert = yield leadsToBeInserted(latestData, report, lastSavedIndex, citySet, sourceSet, courseSet, requiredColumnHeaders);
    if (!dataToInsert || dataToInsert.length === 0) {
        if (report.rowsFailed != 0) {
            (0, mailer_1.sendEmail)(secrets_1.LEAD_MARKETING_EMAIL, 'Lead Processing Report', (0, formatReport_1.formatReport)(report));
            logger_1.default.info('Error report sent to Lead!');
        }
        logger_1.default.info('No valid data to insert.');
        (0, googleSheetOperations_1.updateStatusForMarketingSheet)(lastSavedIndex + latestData.length, lastSavedIndex, report, sheetId, sheetName);
        return;
    }
    try {
        const insertedData = yield lead_1.LeadMaster.insertMany(dataToInsert, { ordered: false, throwOnValidationError: true });
        report.actullyProcessedRows = insertedData.length;
    }
    catch (error) {
        try {
            report.actullyProcessedRows = error.result.insertedCount;
            error.writeErrors.map((e) => {
                report.rowsFailed++;
                if (e.err.code === 11000) {
                    report.duplicateRowIds.push(e.err.index + lastSavedIndex + 1);
                }
                else {
                    report.otherIssue.push({ rowId: e.err.index + lastSavedIndex + 1, issue: e.err.errmsg });
                }
            });
        }
        catch (error) {
            logger_1.default.error(`Error processing rows: ${JSON.stringify(error)}`);
        }
    }
    if (report.rowsFailed != 0) {
        (0, mailer_1.sendEmail)(secrets_1.LEAD_MARKETING_EMAIL, 'Lead Processing Report', (0, formatReport_1.formatReport)(report));
        logger_1.default.info('Error report sent to Lead!');
    }
    (0, dropDownMetadataController_1.updateDropDownByType)(constants_1.DropDownType.MARKETING_CITY, Array.from(citySet));
    (0, dropDownMetadataController_1.updateDropDownByType)(constants_1.DropDownType.MARKETING_SOURCE, Array.from(sourceSet));
    (0, dropDownMetadataController_1.updateDropDownByType)(constants_1.DropDownType.MARKETING_COURSE_CODE, Array.from(courseSet));
    (0, googleSheetOperations_1.updateStatusForMarketingSheet)(lastSavedIndex + latestData.length, lastSavedIndex, report, sheetId, sheetName);
});
exports.saveDataToDb = saveDataToDb;
