import { Request } from "express";
import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { defaultSender, transporter } from "../../utils/sendEmail";
import { ICreateEmail } from "./email.validation";

const sentEmail = async (req: Request) => {
  const payload = req.body as ICreateEmail;

  const { sender, recipient, subject, body, source } = payload;

  const from = sender || defaultSender;

  const emailSendOptions = {
    sender: from,
    to: recipient,
    subject,
    text: body,
  };

  const { rejected } = await transporter.sendMail(emailSendOptions);

  if (rejected.length) {
    console.log("Email rejected", rejected);
    throw new ApiError(500, "Email sending failed!");
  }

  const result = await prisma.email.create({
    data: {
      sender: from,
      recipient,
      subject,
      body,
      source,
    },
  });

  // ✅ Step 5: Return response
  return {
    message: "Email sent successfully!",
    data: result,
  };
};

const getEmail = async () => {
  const result = await prisma.email.findMany();
  if (!result) {
    throw new ApiError(404, "Email not found!");
  }

  return result;
};

export const sentEmailService = {
  sentEmail,
  getEmail,
};
