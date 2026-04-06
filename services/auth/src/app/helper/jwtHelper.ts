import httpStatus from "http-status";
import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import ApiError from "../errors/ApiError";

const generateToken = (payload: any, secret: Secret, expiresIn: string) => {
  const token = jwt.sign(payload, secret, {
    algorithm: "HS256",
    expiresIn,
  } as SignOptions);

  return token;
};

const verifyToken = (token: string, secret: Secret): JwtPayload => {
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Token has expired!");
    }
    if (error.name === "JsonWebTokenError") {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token!");
    }
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized!");
  }
};

export const jwtHelpers = {
  generateToken,
  verifyToken,
};
