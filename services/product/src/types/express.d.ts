import { IAuthUser } from "../app/interface/auth";

// import { IAuthUser } from "../app/interface/auth";

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}