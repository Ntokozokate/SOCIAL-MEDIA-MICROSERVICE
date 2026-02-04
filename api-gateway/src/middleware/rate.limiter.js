require("dotenv").config();
const redisClient = require("./ioredis.client");
const {
  RateLimiterRedis,
  RateLimiterMemory,
} = require("rate-limiter-flexible");
const logger = require("../utils/logger");

//Setting up insurance limiter(In memory fall back ) id redis db fails
const insuranceLimiterConfig = new RateLimiterMemory({
  points: 100,
  duration: 1,
});

//DDos protection||Gateway- Wide
const gatewayWideLimiterConfig = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 1000,
  duration: 1,
  insuranceLimiter: insuranceLimiterConfig,
});

//configure sensitivelimiter
const serviceSpecificLimiterConfig = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "sensitive",
  points: 30, // only 5 attempts
  duration: 1,
  //blockDuration: 60 * 30, // lock out for 30 mins
  insuranceLimiter: new RateLimiterMemory({ points: 50, duration: 1 }),
});

const sensitiveEndpointsRateLimiter = async (req, res, next) => {
  try {
    await serviceSpecificLimiterConfig.consume(req.ip);
    next();
  } catch (rej) {
    logger.warn(`Rate limit exceeded for IP:  ${req.ip}`);
    res.status(429).json({
      message: "Too many attempts",
      success: false,
    });
  }
};

const gatewayWideLimiter = async (req, res, next) => {
  try {
    await gatewayWideLimiterConfig.consume(req.ip);
    next();
  } catch (rej) {
    logger.warn(`Rate limit exceeded for IP:  ${req.ip}`);
    res.status(429).json({
      message: "Too many attempts",
      success: false,
    });
  }
};
module.exports = { gatewayWideLimiter, sensitiveEndpointsRateLimiter };
