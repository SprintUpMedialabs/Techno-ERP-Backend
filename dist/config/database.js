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
exports.initializeDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const enquiryIdMetaDataSchema_1 = require("../admission/models/enquiryIdMetaDataSchema");
const secrets_1 = require("../secrets");
const dropDownMetaDeta_1 = require("../utilityModules/dropdown/dropDownMetaDeta");
const constants_1 = require("./constants");
const logger_1 = __importDefault(require("./logger"));
const metadata_1 = require("./metadata");
const metadata_2 = require("./metadata");
const connectToDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(secrets_1.MONGODB_DATABASE_URL, {
            dbName: secrets_1.MONGODB_DATABASE_NAME
        });
        logger_1.default.info('Database connected successfully !');
    }
    catch (error) {
        logger_1.default.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
});
const initializeDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const existingDoc = await SpreadSheetMetaData.find({ name: MARKETING_SHEET });
        // if (existingDoc.length == 0) {
        //   await SpreadSheetMetaData.create({
        //     name: MARKETING_SHEET,
        //     lastIdxMarketingSheet: 1
        //   });
        //   logger.debug('Initialized database with default Marketing Sheet entry.');
        // } else {
        //   logger.debug('Marketing Sheet entry already exists.');
        // }
        const prefixes = [constants_1.FormNoPrefixes.TIHS, constants_1.FormNoPrefixes.TCL, constants_1.FormNoPrefixes.TIMS, constants_1.PHOTO];
        for (const prefix of prefixes) {
            const existingEntry = yield enquiryIdMetaDataSchema_1.EnquiryApplicationId.findOne({ prefix });
            if (!existingEntry) {
                yield enquiryIdMetaDataSchema_1.EnquiryApplicationId.create({
                    prefix,
                    lastSerialNumber: 100
                });
                logger_1.default.debug(`Initialized database with default serial number for ${prefix}`);
            }
            else {
                logger_1.default.debug(`${prefix} serial number already exists`);
            }
        }
        yield initializeDropDowns();
        yield initializeCourseMetadata();
    }
    catch (error) {
        logger_1.default.error('Error initializing database:', error);
        process.exit(1);
    }
});
exports.initializeDB = initializeDB;
const initializeDropDowns = () => __awaiter(void 0, void 0, void 0, function* () {
    // City Dropdown => no need to add values from our side as its going to be used for marketing module only as of now
    const existingCityDropDown = yield dropDownMetaDeta_1.DropDownMetaData.findOne({ type: constants_1.DropDownType.MARKETING_CITY });
    if (!existingCityDropDown) {
        yield dropDownMetaDeta_1.DropDownMetaData.create({
            type: constants_1.DropDownType.MARKETING_CITY,
        });
    }
    // Marketing Source Dropdown => no need to add values from our side as its going to be used for marketing module only as of now
    const existingSourceDropDown = yield dropDownMetaDeta_1.DropDownMetaData.findOne({ type: constants_1.DropDownType.MARKETING_SOURCE });
    if (!existingSourceDropDown) {
        yield dropDownMetaDeta_1.DropDownMetaData.create({
            type: constants_1.DropDownType.MARKETING_SOURCE,
        });
    }
    // Course Dropdown => no need to add values from our side as its going to be used for marketing module only as of now
    const existingCourseDropDown = yield dropDownMetaDeta_1.DropDownMetaData.findOne({ type: constants_1.DropDownType.MARKETING_COURSE_CODE });
    if (!existingCourseDropDown) {
        yield dropDownMetaDeta_1.DropDownMetaData.create({
            type: constants_1.DropDownType.MARKETING_COURSE_CODE,
        });
    }
    // Fix City Dropdown
    const existingFixCityDropDown = yield dropDownMetaDeta_1.DropDownMetaData.findOne({ type: constants_1.DropDownType.FIX_MARKETING_CITY });
    const fixCityDropdownSet = new Set((existingFixCityDropDown === null || existingFixCityDropDown === void 0 ? void 0 : existingFixCityDropDown.value) || []);
    metadata_2.fixCityList.forEach(city => fixCityDropdownSet.add(city));
    const sortedCityValues = Array.from(fixCityDropdownSet).sort((a, b) => {
        if (a === "Other")
            return 1;
        if (b === "Other")
            return -1;
        return a.localeCompare(b);
    });
    yield dropDownMetaDeta_1.DropDownMetaData.findOneAndUpdate({ type: constants_1.DropDownType.FIX_MARKETING_CITY }, { value: sortedCityValues }, { upsert: true });
    // Fix Course Dropdown
    const existingFixCourseDropDown = yield dropDownMetaDeta_1.DropDownMetaData.findOne({ type: constants_1.DropDownType.FIX_MARKETING_COURSE_CODE });
    const fixCourseDropdownSet = new Set((existingFixCourseDropDown === null || existingFixCourseDropDown === void 0 ? void 0 : existingFixCourseDropDown.value) || []);
    metadata_1.fixCourseCodeList.forEach(code => fixCourseDropdownSet.add(code));
    const sortedValues = Array.from(fixCourseDropdownSet).sort((a, b) => {
        if (a === "Other")
            return 1;
        if (b === "Other")
            return -1;
        return a.localeCompare(b);
    });
    yield dropDownMetaDeta_1.DropDownMetaData.findOneAndUpdate({ type: constants_1.DropDownType.FIX_MARKETING_COURSE_CODE }, { value: sortedValues }, { upsert: true });
    // District Dropdown
    const existingDistrictDropDown = yield dropDownMetaDeta_1.DropDownMetaData.findOne({ type: constants_1.DropDownType.DISTRICT });
    const districtDropdownSet = new Set((existingDistrictDropDown === null || existingDistrictDropDown === void 0 ? void 0 : existingDistrictDropDown.value) || []);
    metadata_2.fixCityList.forEach(district => districtDropdownSet.add(district));
    const sortedDistrictValues = Array.from(districtDropdownSet).sort((a, b) => {
        if (a === "Other")
            return 1;
        if (b === "Other")
            return -1;
        return a.localeCompare(b);
    });
    yield dropDownMetaDeta_1.DropDownMetaData.findOneAndUpdate({ type: constants_1.DropDownType.DISTRICT }, { value: sortedDistrictValues }, { upsert: true });
});
const initializeCourseMetadata = () => __awaiter(void 0, void 0, void 0, function* () {
});
exports.default = connectToDatabase;
