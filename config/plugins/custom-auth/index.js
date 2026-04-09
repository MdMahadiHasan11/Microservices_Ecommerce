const axios = require("axios");

class CustomAuth {
  constructor(config) {
    this.config = config;
  }

  async access(kong) {
    try {
      kong.log.notice("Custom auth plugin is running");

      const headers = await kong.request.get_headers();
      kong.log.notice("headers Response : ", headers);

      const token_place = this.config.token_place || "Authorization";
      const authHeader =
        headers[token_place.toLowerCase()] &&
        headers[token_place.toLowerCase()][0];

      const token = authHeader ? authHeader.split(" ")[1] : null;

      kong.log.notice("token Response : ", token);

      if (!token) {
        return await kong.response.exit(
          401,
          JSON.stringify({
            message: "Unauthorized",
          }),
        );
      }

      const response = await axios.post(this.config.validation_endpoint, {
        accessToken: token,
      });

      if (response.success === false) {
        return await kong.response.exit(
          401,
          JSON.stringify({
            message: "Unauthorized",
          }),
        );
      }

      kong.log.notice(
        "response Response : ",
        JSON.stringify(response.data.data),
      );

      kong.service.request.set_header("x-user-id", response.data.data.id);
      kong.service.request.set_header("x-user-email", response.data.data.email);
      kong.service.request.set_header("x-user-name", response.data.data.name);
      kong.service.request.set_header("x-user-role", response.data.data.role);

      return;
    } catch (error) {
      const message = error.message || "You are not authorized!";

      return await kong.response.exit(
        401,
        JSON.stringify({
          message,
        }),
      );
    }
  }
}

module.exports = {
  Plugin: CustomAuth,
  Schema: [
    {
      validation_endpoint: {
        type: "string",
        required: true,
        description: "The URL of the validation endpoint",
      },
    },
    {
      token_place: {
        type: "string",
        required: false,
        default: "Authorization",
        description: "The token place",
      },
    },
  ],
  version: "1.0.0",
  Priority: 0,
};
