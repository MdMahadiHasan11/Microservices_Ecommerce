// js-plugins/custom-auth/custom-auth.js

class CustomAuth {
  constructor(config) {
    this.config = config;
  }

  async access(kong) {
    try {
      kong.log.notice("Custom Auth Plugin (JS) is running");

      const headers = await kong.request.getHeaders();
      kong.log.notice("Request Headers:", headers);

      const tokenPlace = this.config.token_place || "authorization";
      const authHeader =
        headers[tokenPlace.toLowerCase()] || headers[tokenPlace];

      let token = null;
      if (authHeader) {
        token = Array.isArray(authHeader) ? authHeader[0] : authHeader;
        token = token.split(" ")[1] || token; // Bearer token নেওয়া
      }

      kong.log.notice("Extracted Token:", token);

      if (!token) {
        return kong.response.exit(401, { message: "Unauthorized: No token" });
      }

      // আপনার validation endpoint-এ axios দিয়ে request
      const axios = require("axios");
      const response = await axios.post(this.config.validation_endpoint, {
        accessToken: token,
      });

      const data = response.data;

      if (!data || data.success === false) {
        return kong.response.exit(401, { message: "Unauthorized" });
      }

      const user = data.data || data;

      kong.log.notice("User authenticated:", user.id);

      // হেডার যোগ করা
      await kong.service.request.setHeader("x-user-id", user.id || "");
      await kong.service.request.setHeader("x-user-email", user.email || "");
      await kong.service.request.setHeader("x-user-name", user.name || "");
      await kong.service.request.setHeader("x-user-role", user.role || "");
    } catch (error) {
      kong.log.err("Custom Auth Error:", error.message);
      return kong.response.exit(401, {
        message: error.message || "You are not authorized!",
      });
    }
  }
}

module.exports = {
  Plugin: CustomAuth,
  Schema: [
    {
      validation_endpoint: { type: "string", required: true },
    },
    {
      token_place: {
        type: "string",
        default: "Authorization",
        required: false,
      },
    },
  ],
  version: "1.0.0",
  priority: 1000, // উচ্চ প্রায়োরিটি
};
