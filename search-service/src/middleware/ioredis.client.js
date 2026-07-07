require("dotenv").config();
const Redis = require("ioredis");
const logger = require("../utils/logger");

//Redis setup and connect
const redisClient = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false, //insurence strategy
});

redisClient.on("connect", () => {
  logger.info("Redis connected");
});

redisClient.on("error", (err) => {
  logger.error("Redis error", err);
});

module.exports = redisClient;
