import nodemailer from 'nodemailer';
import {
  NODEMAILER_HOST,
  NODEMAILER_PORT,
  NODEMAILER_SENDER_ADDRESS,
  NODEMAILER_GMAIL_APP_PASSWORD
} from '../secrets';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

let transport = nodemailer.createTransport({
  host: NODEMAILER_HOST,
  port: Number(NODEMAILER_PORT),
  secure: true,
  auth: {
    user: NODEMAILER_SENDER_ADDRESS,
    pass: NODEMAILER_GMAIL_APP_PASSWORD
  }
});

// TODO: we need to have some robust approach here
export const sendEmail = async (to: string, subject: string, text: string) => {
  const mailOptions = {
    from: NODEMAILER_SENDER_ADDRESS,
    to,
    subject,
    html: text
  };

  transport.sendMail(mailOptions, function (err, info) {
    if (err) {
      logger.error(err);
    } else {
      logger.info('Mail sent successfully');
    }
  });
};
