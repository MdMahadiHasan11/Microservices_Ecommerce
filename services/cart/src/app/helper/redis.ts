import Redis from "ioredis";
import config from "../../config";

const redis = new Redis({
  host: config.redis.redis_host,
  port: Number(config.redis.redis_port),
});

export default redis;
