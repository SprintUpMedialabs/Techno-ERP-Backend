import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  // host:process.env.SMTP_HOST,
  // port:process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_KEY
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
