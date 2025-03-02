import dotenv from "dotenv"
dotenv.config()

export const MONGODB_DATABASE_URL = process.env.MONGODB_DATABASE_URL!
export const PORT = process.env.PORT!
export const NODEMAILER_HOST = process.env.NODEMAILER_HOST!
export const NODEMAILER_SENDER_ADDRESS = process.env.NODEMAILER_SENDER_ADDRESS!
export const NODEMAILER_PORT = process.env.NODEMAILER_PORT!
export const NODEMAILER_GMAIL_APP_PASSWORD = process.env.NODEMAILER_GMAIL_APP_PASSWORD!
