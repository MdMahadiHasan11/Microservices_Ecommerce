import axios, { AxiosRequestConfig } from "axios";
import { IRouter, NextFunction, Request, Response } from "express";
import middlewares from "../app/middlewares/auth";

type HttpMethod = "get" | "post" | "put" | "delete" | "patch";

export const createHandler = (
  hostName: string,
  path: string,
  method: HttpMethod,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Replace path params safely
      let targetUrl = path;

      Object.entries(req.params).forEach(([key, value]) => {
        const strValue = Array.isArray(value) ? value[0] : value || "";
        targetUrl = targetUrl.replace(new RegExp(`:${key}`, "g"), strValue);
      });

      const fullUrl = `${hostName}${targetUrl}`;

      // Clean & controlled headers (IMPORTANT)
      const headers: Record<string, any> = {
        origin: req.headers.origin,
        "x-user-id": req.headers["x-user-id"] || "",
        "x-user-email": req.headers["x-user-email"] || "",
        "x-user-name": req.headers["x-user-name"] || "",
        "x-user-role": req.headers["x-user-role"] || "",
        "user-agent": req.headers["user-agent"] || "",
        

        "content-type": "application/json",
        "x-gateway-secret": process.env.GATEWAY_SECRET,
      };

      if (req.headers.authorization) {
        headers.authorization = req.headers.authorization;
      }

      // Axios config (PRO LEVEL)
      const config: AxiosRequestConfig = {
        method,
        url: fullUrl,
        data: req.body,
        params: req.query,
        headers,
        timeout: 5000, // ⏱️ prevent hanging
        validateStatus: () => true, // ❗ handle all status manually
      };

      const response = await axios(config);

      // Forward exact response (VERY IMPORTANT)
      return res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error("🔥 Gateway Error:", {
        method,
        path,
        message: error.message,
      });

      return res.status(500).json({
        success: false,
        message: "Gateway Internal Error",
      });
    }
  };
};

export const getMiddlewares = (names: string[]) => {
  console.log(names); //[ 'auth' ]
  return names.map((name) => middlewares[name as keyof typeof middlewares]);
};

export const configureRoutes = (router: IRouter, config: any) => {
  console.log("🚀 Starting API Gateway Route Configuration...");

  Object.entries(config.services).forEach(
    ([serviceName, service]: [string, any]) => {
      const hostName = service.url;

      console.log(`📡 ${serviceName} → ${hostName}`);

      service.routes.forEach((route: any) => {
        route.methods.forEach((methodStr: string) => {
          const method = methodStr.toLowerCase() as HttpMethod;

          if (!["get", "post", "put", "delete", "patch"].includes(method)) {
            console.warn(`⚠️ Invalid method: ${methodStr}`);
            return;
          }

          const handler = createHandler(hostName, route.path, method);

          const middleware = getMiddlewares(route.middlewares);

          router[method](route.path, ...middleware, handler);

          // (router as any)[method](route.path, ...middleware, handler);
          // (router as any)[method](route.path, handler);

          console.log(
            `✅ ${method.toUpperCase()} ${route.path} → ${serviceName}`,
          );
        });
      });
    },
  );

  console.log("✅ All routes configured!");
};
