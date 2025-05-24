import nodemailer from 'nodemailer';
import {
  NODEMAILER_HOST,
  NODEMAILER_PORT,
  NODEMAILER_SENDER_ADDRESS,
  NODEMAILER_GMAIL_APP_PASSWORD
} from '../secrets';
import logger from './logger';
import createHttpError from 'http-errors';

type Attachment = {
  filename: string;
  content: Buffer;
};

let transport = nodemailer.createTransport({
  host: NODEMAILER_HOST,
  port: Number(NODEMAILER_PORT),
  secure: true,
  auth: {
    user: NODEMAILER_SENDER_ADDRESS,
    pass: NODEMAILER_GMAIL_APP_PASSWORD
  }
});

// TODO: we need to have some robust approach here => What changes are we expecting?
export const sendEmail = async (to: string, subject: string, text: string, attachments?: Attachment[]) => {
  const mailOptions = {
    from: NODEMAILER_SENDER_ADDRESS,
    to,
    subject,
    html: text,
    attachments
  };

  transport.sendMail(mailOptions, function (err : any, info : any) {
    if (err) {
      logger.error('Error in sending email');
      logger.error(err);
      throw createHttpError(400, err.message);
    } else {
      logger.info('Mail sent successfully');
    }
  });
};
