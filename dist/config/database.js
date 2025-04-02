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
const spreadSheet_1 = require("../crm/models/spreadSheet");
const logger_1 = __importDefault(require("./logger"));
const constants_1 = require("./constants");
const secrets_1 = require("../secrets");
const enquiryIdMetaDataSchema_1 = require("../admission/models/enquiryIdMetaDataSchema");
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
        const existingDoc = yield spreadSheet_1.SpreadSheetMetaData.find({ name: constants_1.MARKETING_SHEET });
        //console.log(existingDoc);
        if (existingDoc.length == 0) {
            console.log(existingDoc);
            yield spreadSheet_1.SpreadSheetMetaData.create({
                name: constants_1.MARKETING_SHEET,
                lastIdxMarketingSheet: 1
            });
            logger_1.default.debug('Initialized database with default Marketing Sheet entry.');
        }
        else {
            logger_1.default.debug('Marketing Sheet entry already exists.');
        }
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
    }
    catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
});
exports.initializeDB = initializeDB;
exports.default = connectToDatabase;
