"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvVariables = void 0;
const logger_1 = __importDefault(require("./logger"));
const requiredEnvVariables = [
    'MONGODB_DATABASE_URL',
    'PORT',
    'NODEMAILER_HOST',
    'MONGODB_DATABASE_NAME',
    'NODEMAILER_SENDER_ADDRESS',
    'NODEMAILER_PORT',
    'NODEMAILER_GMAIL_APP_PASSWORD',
    'JWT_SECRET',
    'CRYPTO_HASH_SECRET',
    'AUTH_API_PATH',
    'GOOGLE_SA_CLIENT_EMAIL',
    'GOOGLE_SA_PRIVATE_KEY',
    'MARKETING_SHEET_PAGE_NAME',
    'LEAD_MARKETING_EMAIL',
    'MARKETING_SHEET_ID',
    'AUDIT_LOG_SERVICE_URL',
    'SERVICE_AUTH_TOKEN',
    'DEVELOPER_EMAIL'
];
const validateEnvVariables = () => {
    const missingVars = requiredEnvVariables.filter((envVar) => !process.env[envVar]);
    if (missingVars.length > 0) {
        logger_1.default.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
        process.exit(1); // Terminate the program
    }
};
exports.validateEnvVariables = validateEnvVariables;
