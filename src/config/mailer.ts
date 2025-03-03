import nodemailer from 'nodemailer';
import { NODEMAILER_HOST, NODEMAILER_PORT, NODEMAILER_SENDER_ADDRESS, NODEMAILER_GMAIL_APP_PASSWORD } from '../secrets';
import dotenv from 'dotenv';

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

export const sendEmail = async (to: string, subject: string, text: string) => {
  const mailOptions = {
    from: NODEMAILER_SENDER_ADDRESS,
    to,
    subject,
    html : text
  };

  transport.sendMail(mailOptions, function (err, info) {
    if (err) {
      console.log(err);
    } else {
      console.log(info);
    }
  });
};
