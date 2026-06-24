require("dotenv").config();

const redisClient = require("./ioredis.client");

const {
  RateLimiterRedis,
  RateLimiterMemory,
} = require("rate-limiter-flexible");
const logger = require("../utils/logger");

//Setting up insurance limiter(In memory fall back ) id redis db fails
const insuranceLimiterConfig = new RateLimiterMemory({
  points: 10,
  duration: 1,
});

//DDos protection||Application-layer-rate-limiting
const applicationRateLimiterConfig = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 30,
  duration: 1,
  insuranceLimiter: insuranceLimiterConfig,
});

//configure sensitivelimiter
const sensitiveEndpointsRateLimiterConfig = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "sensitive",
  points: 20, // only 10 attempts
  duration: 60 * 15, // in 15 mins
  blockDuration: 60 * 2, // lock out for 30 mins
  insuranceLimiter: new RateLimiterMemory({ points: 15, duration: 60 * 15 }),
});

const sensitiveEndPointLimiter = async (req, res, next) => {
  try {
    await sensitiveEndpointsRateLimiterConfig.consume(req.ip);
    next();
  } catch (rej) {
    logger.warn(`Rate limit exceeded for IP:  ${req.ip}`);
    res.status(429).json({
      message: "Too many attempts, try after 30 minutes",
      success: false,
    });
  }
};

const globalRateLimiter = async (req, res, next) => {
  try {
    await applicationRateLimiterConfig.consume(req.ip);
    next();
  } catch (rej) {
    logger.warn(`Rate limit exceeded for IP:  ${req.ip}`);
    res.status(429).json({
      message: "Too many attempts, try say after 30 mins",
      success: false,
    });
  }
};
module.exports = { globalRateLimiter, sensitiveEndPointLimiter };
