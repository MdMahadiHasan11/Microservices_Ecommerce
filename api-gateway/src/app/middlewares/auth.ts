import axios from "axios";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../config";
import ApiError from "../errors/ApiError";

// const auth2 = (...roles: string[]) => {
//   return async (
//     req: Request & { user?: any },
//     res: Response,
//     next: NextFunction,
//   ) => {
//     try {
//       const token = req.headers.authorization || req.cookies.accessToken;
//       if (!token) {
//         throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!");
//       }

//       const verifiedUser = jwtHelpers.verifyToken(
//         token,
//         config.jwt.jwt_secret as Secret,
//       );

//       req.user = verifiedUser;

//       if (roles.length && !roles.includes(verifiedUser.role)) {
//         throw new ApiError(httpStatus.FORBIDDEN, "Forbidden!");
//       }
//       next();
//     } catch (err) {
//       next(err);
//     }
//   };
// };

// export default auth2;

const auth = async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.headers["authorization"]) {
    return next(
      new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!"),
    );
  }
  // const result = req.headers["authorization"];
  // console.log(result);

  try {
    const token = req.headers["authorization"]?.split(" ")[1];

    const response = await axios.post(
      `${config.auth_service_url}/auth/verify-token`,
      {
        accessToken: token,

        headers: {
          ip: req.ip,
          "user-agent": req.headers["user-agent"],
        },
      },
    );
    const data = response.data.data;

    req.headers["x-user-id"] = data.id;
    req.headers["x-user-email"] = data.email;
    req.headers["x-user-name"] = data.name;
    req.headers["x-user-role"] = data.role;
    next();
  } catch (error) {
    return next(
      new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!"),
    );
  }
};

const middlewares = { auth };
export default middlewares;
