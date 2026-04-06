import { LoginAttempt } from "@prisma/client";
import axios from "axios";
import * as bcrypt from "bcryptjs";
import crypto from "crypto";
import { Request } from "express";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../../config";
import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { jwtHelpers } from "../../helper/jwtHelper";
import {
  createLoginHistory,
  extractRequestInfo,
  handleFailedLogin,
} from "./user-utils";
import { ICreateUser } from "./user.validation";
const generateVerificationCode = (): string => {
  // Generate a secure random number between 10000 and 99999
  const code = crypto.randomInt(100000, 999999);
  return code.toString();
};

const createUser = async (req: Request) => {
  const payload = req.body as ICreateUser;

  // 🔍 Step 1: Check existing user
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User already exists");
  }

  // 🔐 Step 2: Hash password
  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.salt_round),
  );

  // 🗄️ Step 3: DB Transaction (only DB logic)
  const user = await prisma.$transaction(async (tx) => {
    return await tx.user.create({
      data: {
        ...payload,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        status: true,
        verified: true,
      },
    });
  });

  // 🌐 Step 4: External Service Call (isolated)
  console.log(config.user_service_url);

  try {
    const response = await axios.post(
      `${config.user_service_url}/user/create-user`,
      {
        authUserId: user.id,
        email: user.email,
        name: user.name,
      },
    );
  } catch (error: any) {
    console.error("User Service Sync Failed:", error?.message);
    // 🧠 Extract real error from axios
    const status = error?.response?.status || httpStatus.BAD_GATEWAY;
    const message =
      error?.response?.data?.message || error?.message || "User service error";

    // 🔥 Compensation (rollback)
    await prisma.user.delete({
      where: { id: user.id },
    });
    // ✅ Forward original error to client
    throw new ApiError(status, message);
  }

  const code = generateVerificationCode();

  await prisma.verificationCode.create({
    data: {
      userId: user.id,
      code,
      expiredAt: new Date(Date.now() + 5 * 60 * 1000 * 60),
    },
  });

  let emailResponse: any;

  try {
    emailResponse = await axios.post(`${config.email_service_url}/email/send`, {
      recipient: user.email,
      subject: "Email Verification",
      body: `Your verification code is ${code}`,
      source: "user-registration",
    });
  } catch (error: any) {
    console.error("Email Service Sync Failed:", error?.message);
    const status = error?.response?.status || httpStatus.BAD_GATEWAY;
    const message =
      error?.response?.data?.message || error?.message || "Email service error";
    throw new ApiError(status, message);
  }

  // ✅ Step 5: Return response
  return {
    message: "User created successfully and verification code sent to email",
    user,
  };
};

const loginUser = async (req: Request) => {
  const payload = req.body as ICreateUser;

  const { ipAddress, userAgent } = extractRequestInfo(req);

  // 🔍 Find user
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  // ❌ User not found
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
  }

  // 🔐 Password check
  const isPasswordValid = await bcrypt.compare(
    payload.password,
    user.password!,
  );

  if (!isPasswordValid) {
    return handleFailedLogin({
      userId: user.id,
      userAgent,
      ipAddress,
      message: "Invalid credentials",
    });
  }

  // 📩 Verify check
  if (!user.verified) {
    return handleFailedLogin({
      userId: user.id,
      userAgent,
      ipAddress,
      message: "Account not verified",
    });
  }

  // 🚫 Status check
  if (user.status !== "ACTIVE") {
    return handleFailedLogin({
      userId: user.id,
      userAgent,
      ipAddress,
      message: "Account not active",
    });
  }

  // 🔑 Generate tokens
  const tokenPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtHelpers.generateToken(
    tokenPayload,
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string,
  );

  const refreshToken = jwtHelpers.generateToken(
    tokenPayload,
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string,
  );

  // ✅ Success login history
  await createLoginHistory({
    userId: user.id,
    userAgent,
    ipAddress,
    attempt: LoginAttempt.SUCCESS,
  });

  return {
    accessToken,
    refreshToken,
  };
};

const verifyToken = async (accessToken: string) => {
  if (!accessToken) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!");
  }

  const verifiedUser = jwtHelpers.verifyToken(
    accessToken,
    config.jwt.jwt_secret as Secret,
  );

  if (!verifiedUser) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!!!!");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: verifiedUser.id,
    },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!");
  }

  return user;
};

const verifyEmail = async (payload: { email: string; code: string }) => {
  const { email, code } = payload;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not found!");
  }

  const verificationCode = await prisma.verificationCode.findFirst({
    where: {
      userId: user.id,
      code,
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!verificationCode) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid verification code!");
  }

  if (verificationCode.expiredAt < new Date()) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Verification code expired!");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        verified: true,
        status: "ACTIVE",
      },
    }),
    prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: {
        status: "USED",
        verifiedAt: new Date(),
      },
    }),
  ]);

  await axios.post(`${config.email_service_url}/email/send`, {
    recipient: user.email,
    subject: "Account Verification",
    body: "Your account has been verified successfully!",
    source: "VERIFY_EMAIL",
  });

  return null;
};

export const userService = {
  createUser,
  loginUser,
  verifyToken,
  verifyEmail,
};
