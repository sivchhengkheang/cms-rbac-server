import redisClient, { isRedisAvailable } from "../config/redisClient.js";

export const cacheMiddleware = (expireIn) => {
  return async (req, res, next) => {
    try {
      if (!isRedisAvailable()) {
        return next();
      }

      const cacheKey = req.originalUrl;
      const cacheData = await redisClient.get(cacheKey);

      if (cacheData) {
        console.log(`Cache Hit for ${cacheKey}`);
        return res.json(JSON.parse(cacheData));
      }

      const originalJson = res.json;

      res.json = (body) => {
        redisClient
          .setEx(cacheKey, expireIn, JSON.stringify(body))
          .catch((err) => console.error("Redis setEx error", err));

        return originalJson(body);
      };

      console.log(`Cache Missed for ${cacheKey}`);
      return next();
    } catch (error) {
      console.warn("Redis cache middleware skipped:", error.message);
      return next();
    }
  };
};
