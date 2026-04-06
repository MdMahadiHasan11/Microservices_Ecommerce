import { z } from "zod";

const CreateUserSchema = z.object({
  password: z
    .string({
      error: "Password is required!",
    })
    .min(6),
  name: z.string({
    error: "Name is required!",
  }),
  email: z.string({
    error: "Email is required!",
  }),
});

const LoginSchema = z.object({
  password: z
    .string({
      error: "Password is required!",
    })
    .min(6),
  email: z.string({
    error: "Email is required!",
  }),
});

const VerifyTokenSchema = z.object({
  accessToken: z.string(),
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string(),
});

export type ICreateUser = z.infer<typeof CreateUserSchema>;
export type ILoginUser = z.infer<typeof LoginSchema>;
export type IVerifyToken = z.infer<typeof VerifyTokenSchema>;
export type IVerifyEmail = z.infer<typeof verifyEmailSchema>;

export const userValidation = {
  CreateUserSchema,
  LoginSchema,
  VerifyTokenSchema,
  verifyEmailSchema,
};
