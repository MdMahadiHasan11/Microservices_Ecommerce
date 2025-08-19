import crypto from "crypto";
import { User } from "../user/user.model";
import AppError from "../../errorHelpers/AppError";
import { deleteCache, getCache, setCache } from "../../utils/redis.helper";
import { cacheKeys } from "../../../constants/constant";
import { sendEmail } from "../../utils/sendEmail";

const generateOtp = (length = 6) => {
  //6 digit otp
  const otp = crypto.randomInt(10 ** (length - 1), 10 ** length).toString();
  return otp;
};

const sendOTP = async (email: string, name: string) => {
  // console.log(email, name);
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(404, "User here not found");
  }

  if (user.isVerified) {
    throw new AppError(401, "You are already verified");
  }
  const otp = generateOtp();

  const redisKey = `otp:${email}`;

  await setCache(redisKey, otp, cacheKeys.OTP_EXPIRATION);

  await sendEmail({
    to: email,
    subject: "Your OTP Code",
    templateName: "otp",
    templateData: {
      name: name,
      otp: otp,
    },
  });
};

const verifyOTP = async (email: string, otp: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.isVerified) {
    throw new AppError(401, "You are already verified");
  }

  const redisKey = `otp:${email}`;

  const savedOtp = await getCache(redisKey);

  if (!savedOtp) {
    throw new AppError(401, "Invalid OTP");
  }

  if (savedOtp !== otp) {
    throw new AppError(401, "Invalid OTP");
  }

  await Promise.all([
    User.updateOne({ email }, { isVerified: true }, { runValidators: true }),
    deleteCache(redisKey),
  ]);
};

export const OTPService = {
  sendOTP,
  verifyOTP,
};
