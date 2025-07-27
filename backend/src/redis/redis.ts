import { createClient } from "redis";
import { getEnv } from "../http/utils/getEnv";

const redisClient = createClient({
  username: "default",
  password: getEnv("REDIS_PASSWD"),
  socket: {
    host: getEnv("REDIS_URL", "redis://localhost:6379"),
    port: 11974,
  },
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Client Error:", err);
});

(async () => {
  try {
    await redisClient.connect();
    console.log("✅ Redis connected");
  } catch (err) {
    console.error("❌ Failed to connect to Redis:", err);
  }
})();

export const redis = redisClient;
