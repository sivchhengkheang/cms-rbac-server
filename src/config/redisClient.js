// redisClient.js
import { createClient } from "redis";

const redisClient = createClient({
  socket: {
    reconnectStrategy: false,
  },
});

redisClient.on("connect", () => console.log("Redis client connecting..."));
redisClient.on("ready", () => console.log("Redis client connected and ready!"));
redisClient.on("error", (err) => {
  console.warn("Redis unavailable, continuing without cache:", err.message);
});
redisClient.on("end", () => console.log("Redis client disconnected."));

try {
  await redisClient.connect();
} catch (error) {
  console.warn("Redis not running; continuing without cache.");
}

export const isRedisAvailable = () => !!redisClient.isOpen;
export default redisClient;
