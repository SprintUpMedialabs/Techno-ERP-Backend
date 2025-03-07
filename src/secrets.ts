import dotenv from 'dotenv';
dotenv.config();

export const MONGODB_DATABASE_URL = process.env.MONGODB_DATABASE_URL!;
export const PORT = process.env.PORT!;
export const NODEMAILER_HOST = process.env.NODEMAILER_HOST!;
export const NODEMAILER_SENDER_ADDRESS = process.env.NODEMAILER_SENDER_ADDRESS!;
export const NODEMAILER_PORT = process.env.NODEMAILER_PORT!;
export const NODEMAILER_GMAIL_APP_PASSWORD = process.env.NODEMAILER_GMAIL_APP_PASSWORD!;
export const JWT_SECRET = process.env.JWT_SECRET!;
export const CRYPTO_HASH_SECRET = process.env.CRYPTO_HASH_SECRET!;
export const MONGODB_DATABASE_NAME = process.env.MONGODB_DATABASE_NAME!;

export const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID!
export const GOOGLE_SA_CLIENT_EMAIL = process.env.GOOGLE_SA_CLIENT_EMAIL!
export const GOOGLE_SA_PRIVATE_KEY = process.env.GOOGLE_SA_PRIVATE_KEY!
export const GOOGLE_SHEET_PAGE=process.env.GOOGLE_SHEET_PAGE!

export const AUTH_API_PATH = process.env.AUTH_API_PATH!
