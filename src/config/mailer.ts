import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: '',
  port: 0,
  auth: {
    user: '',
    pass: ''
  }
});

export const sendEmail = async (to: string, subject: string, text: string) => {
  const mailOptions = {
    from: process.env.SENDER_MAIL_ADDRESS,
    to,
    subject,
    text
  };

  await transporter.sendMail(mailOptions);
};
