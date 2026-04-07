import Redis from "ioredis";
import config from "../../config";
import { clearCartService } from "../modules/releaseCart/release.cart";

const redis = new Redis({
  host: config.redis.redis_host,
  port: Number(config.redis.redis_port),
});

const CHANNEL_KEY = "__keyevent@0__:expired";

export const initRedisExpiredListener = async () => {
  await redis.config("SET", "notify-keyspace-events", "Ex");
  await redis.subscribe(CHANNEL_KEY);

  redis.on("message", async (channel, key) => {
    if (channel === CHANNEL_KEY) {
      console.log("Key expired:", key);

      const sessionKey = key.split(":").pop();

      if (!sessionKey) {
        return;
      }
      clearCartService(sessionKey);
    }
  });
};
