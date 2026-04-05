import { z } from "zod";

const CreateUserSchema = z.object({
  authUserId: z.string({
    error: "Auth User Id is required!",
  }),
  name: z.string({
    error: "Name is required!",
  }),
  email: z.string({
    error: "Email is required!",
  }),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export type ICreateUser = z.infer<typeof CreateUserSchema>;

const UserUpdateSchema = CreateUserSchema
  .omit({
    authUserId: true,
  })
  .partial();

  export type IUserUpdate = z.infer<typeof UserUpdateSchema>;

export const userValidation = {
  CreateUserSchema,
  UserUpdateSchema,
};
