import logger from './logger';

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
  'AUDIT_LOG_SERVICE_URL'
];

export const validateEnvVariables = (): void => {
  const missingVars = requiredEnvVariables.filter((envVar) => !process.env[envVar]);
  if (missingVars.length > 0) {
    logger.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1); // Terminate the program
  }
};
