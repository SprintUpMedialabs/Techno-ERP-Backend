import dotenv from 'dotenv';
import path from 'path';

let envFile;

if (process.env.NODE_ENV === 'production') {
    envFile = '.env.prod';
} else if (process.env.NODE_ENV === 'uat') {
    envFile = '.env.uat';
} else {
    envFile = '.env';
}

dotenv.config({ path: path.resolve(__dirname, '../', envFile) });

export const MONGODB_DATABASE_URL = process.env.MONGODB_DATABASE_URL!;
export const MONGODB_PRODUCTION_DATABASE_URL = process.env.MONGODB_PRODUCTION_DATABASE_URL!;
export const PORT = process.env.PORT!;
export const NODEMAILER_HOST = process.env.NODEMAILER_HOST!;
export const NODEMAILER_SENDER_ADDRESS = process.env.NODEMAILER_SENDER_ADDRESS!;
export const NODEMAILER_PORT = process.env.NODEMAILER_PORT!;
export const NODEMAILER_GMAIL_APP_PASSWORD = process.env.NODEMAILER_GMAIL_APP_PASSWORD!;
export const JWT_SECRET = process.env.JWT_SECRET!;
export const CRYPTO_HASH_SECRET = process.env.CRYPTO_HASH_SECRET!;
export const MONGODB_DATABASE_NAME = process.env.MONGODB_DATABASE_NAME!;

export const MARKETING_SHEET_ID = process.env.MARKETING_SHEET_ID!;
export const GOOGLE_SA_CLIENT_EMAIL = process.env.GOOGLE_SA_CLIENT_EMAIL!;
export const GOOGLE_SA_PRIVATE_KEY = process.env.GOOGLE_SA_PRIVATE_KEY!;
export const MARKETING_SHEET_PAGE_NAME = process.env.MARKETING_SHEET_PAGE_NAME!;

export const LEAD_MARKETING_EMAIL = process.env.LEAD_MARKETING_EMAIL!;

export const AUTH_API_PATH = process.env.AUTH_API_PATH!;

export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID!;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY!;
export const AWS_REGION = process.env.AWS_REGION!;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME!;

export const NODE_ENV = process.env.NODE_ENV!;

export const AUDIT_LOG_SERVICE_URL = process.env.AUDIT_LOG_SERVICE_URL!;

export const SERVICE_AUTH_TOKEN = process.env.SERVICE_AUTH_TOKEN!;
export const DEVELOPER_EMAIL = process.env.DEVELOPER_EMAIL!;
export const STUDENT_JWT_SECRET = process.env.STUDENT_JWT_SECRET!

export const SQS_MARKETING_ANALYTICS_QUEUE_URL = process.env.SQS_MARKETING_ANALYTICS_QUEUE_URL!;
export const AWS_SQS_REGION = process.env.AWS_SQS_REGION!;