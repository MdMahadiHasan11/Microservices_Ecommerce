import { NextFunction, Request, Response } from "express";

const verifyCaller = (req: Request, res: Response, next: NextFunction) => {
  const gatewaySecret = req.headers["x-gateway-secret"];
  const serviceSecret = req.headers["x-service-secret"];

  // 1️⃣ Gateway always allowed
  if (gatewaySecret === process.env.GATEWAY_SECRET) return next();

  const allowedServiceSecrets: string[] = [].filter(Boolean) as string[];

  if (
    serviceSecret &&
    allowedServiceSecrets.includes(serviceSecret as string)
  ) {
    return next();
  }

  // 3️⃣ Otherwise block
  return res.status(403).json({
    success: false,
    message: "Forbidden: Only Gateway or Trusted Services allowed",
  });
};

export default verifyCaller;
