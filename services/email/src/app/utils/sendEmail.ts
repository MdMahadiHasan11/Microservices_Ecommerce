/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import ejs from "ejs";
import nodemailer from "nodemailer";
import config from "../../config";

export const transporter = nodemailer.createTransport({
  // secure: false,
  // auth: {
  //   user: config.emailSender.smtp_user as string,
  //   pass: config.emailSender.smtp_pass as string,
  // },
  port: Number(config.smtp.smtp_port || 2525),
  host: config.smtp.smtp_host || "smtp.mailtrap.io",
});

export const defaultSender = config.smtp.default_email_sender as string;

interface SendEmailOptions {
  to: string;
  subject: string;
  templateName: string;
  templateData?: Record<string, any>;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType: string;
  }[];
}
