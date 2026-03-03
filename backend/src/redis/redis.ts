import { createClient, RedisClientType } from "redis";
import { getEnv } from "../http/utils/getEnv"; // dotenv runs here

// required for normal operation, optional with default
const REDIS_URL = getEnv("REDIS_URL", "redis://127.0.0.1:6379");
const REDIS_PASSWD = getEnv("REDIS_PASSWD", ""); // empty string → undefined below

const redisClient: RedisClientType = createClient({
  username: "default",
  password: REDIS_PASSWD || "",
  socket: {
    host: REDIS_URL,
    port: 10484,
  },
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Client Error:", err);
});

(async () => {
  try {
    await redisClient.connect();
    console.log(`✅ Redis connected: ${REDIS_URL}`);
  } catch (err) {
    console.error("❌ Failed to connect to Redis:", err);
  }
})();

export const redis = redisClient;
