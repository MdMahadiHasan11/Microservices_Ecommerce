import { z } from "zod";

const CreateEmailSchema = z.object({
  recipient: z.string().email(),
  subject: z.string(),
  body: z.string(),
  source: z.string(),
  sender: z.string().email().optional(),
});

export type ICreateEmail = z.infer<typeof CreateEmailSchema>;

export const emailValidation = {
  CreateEmailSchema,
};
