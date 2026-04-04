import nodemailer from "nodemailer";
import config from "../../../config";

const emailSender = async (email: string, html: string) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: config.emailSender.smtp_user,
      pass: config.emailSender.smtp_pass, // app password
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const info = await transporter.sendMail({
    from: '"PH Health Care" <' + config.emailSender.smtp_user + ">", // sender address
    to: email, // list of receivers
    subject: "Reset Password Link", // Subject line
    //text: "Hello world?", // plain text body
    html, // html body
  });
};

export default emailSender;
