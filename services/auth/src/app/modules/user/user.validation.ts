import { z } from "zod";

const CreateUserSchema = z.object({
   password: z.string({
    error: "Password is required!",
   }).min(6),
  name: z.string({
    error: "Name is required!",
  }),
  email: z.string({
    error: "Email is required!",
  }),
});

export type ICreateUser = z.infer<typeof CreateUserSchema>;

export const userValidation = {
  CreateUserSchema,
};
