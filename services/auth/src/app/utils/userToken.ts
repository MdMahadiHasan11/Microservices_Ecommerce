import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import { generateToken, verifyToken } from "./jwt";
import AppError from "../errorHelpers/AppError";
import httpStatus from "http-status-codes";
import { isActive, IUser } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
export const createUserToken = (user: Partial<IUser>) => {
  const jwtPayload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };
  const accessToken = generateToken(
    jwtPayload,
    envVars.JWT_ACCESS_SECRET,
    envVars.JWT_ACCESS_EXPIRES
  );

  const refreshToken = generateToken(
    jwtPayload,
    envVars.JWT_REFRESH_SECRET,
    envVars.JWT_REFRESH_EXPIRES
  );
  return { accessToken, refreshToken };
};

export const createNewAccessTokenWithRefreshToken = async (
  refreshToken: string
) => {
  const verifiedRefreshToken = verifyToken(
    refreshToken,
    envVars.JWT_REFRESH_SECRET
  ) as JwtPayload; //verifyRefreshToken(refreshToken);

  const isExist = await User.findOne({ email: verifiedRefreshToken.email });
  if (!isExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User does not exist");
  }

  if (
    isExist.isActive === isActive.BLOCKED ||
    isExist.isActive === isActive.INACTIVE
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This User can  blocked or inactive"
    );
  }
  if (isExist.isDeleted) {
    throw new AppError(httpStatus.BAD_REQUEST, "This User is deleted");
  }

  const jwtPayload = {
    userId: isExist._id,
    email: isExist.email,
    role: isExist.role,
  };
  const accessToken = generateToken(
    jwtPayload,
    envVars.JWT_ACCESS_SECRET,
    envVars.JWT_ACCESS_EXPIRES
  );

  return accessToken;
};
