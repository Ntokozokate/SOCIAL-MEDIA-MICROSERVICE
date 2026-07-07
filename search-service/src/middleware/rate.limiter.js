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

//DDos protection||Global Application-rate-rate-limiting
const applicationRateLimiterConfig = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "global_limit",
  points: 10,
  duration: 1,
  insuranceLimiter: insuranceLimiterConfig,
});

// Post / comments creation limiter config
const creationRateLimiterConfig = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "creation_limit",
  points: 30, // only 5 attempts
  duration: 60 * 15, // in 15 mins
  blockDuration: 60 * 30, // lock out for 30 mins
  insuranceLimiter: new RateLimiterMemory({
    points: 30,
    duration: 60 * 15,
    blockDuration: 60 * 30,
  }),
});

const creationLimiter = async (req, res, next) => {
  try {
    await creationRateLimiterConfig.consume(req.ip);
    next();
  } catch (rej) {
    logger.warn(`Rate limit exceeded for IP:  ${req.ip}`);
    res.status(429).json({
      message: "Too many attempts",
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
      message: "Too many attempts",
      success: false,
    });
  }
};
module.exports = { globalRateLimiter, creationLimiter };
