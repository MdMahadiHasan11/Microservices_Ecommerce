import { NextFunction, Request, Response } from "express";

const verifyCaller = (req: Request, res: Response, next: NextFunction) => {
  const gatewaySecret = req.headers["x-gateway-secret"];
  const serviceSecret = req.headers["x-service-secret"];

  // 1️⃣ If request comes from Gateway
  if (gatewaySecret === process.env.GATEWAY_SECRET) return next();

  const allowedServiceSecrets = [process.env.SERVICE_PRODUCT_SECRET];

  // 2️⃣ If request comes from trusted internal services
  //   const allowedServiceSecrets = [
  //     process.env.SERVICE_A_SECRET,
  //     process.env.SERVICE_B_SECRET,
  //     process.env.SERVICE_C_SECRET,
  //   ];

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
