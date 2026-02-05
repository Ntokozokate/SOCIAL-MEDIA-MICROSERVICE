require("dotenv").config();
const mongoose = require("mongoose");
const logger = require("./utils/logger");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const Redis = require("ioredis");
const { RedisStore } = require("rate-limit-redis");
const { rateLimit } = require("express-rate-limit");
const {
  gatewayWideLimiter,
  sensitiveEndpointsRateLimiter,
} = require("./middleware/rate.limiter");
const proxy = require("express-http-proxy");
const errorHandler = require("./middleware/error.handler");

const app = express();
const port = process.env.PORT || 3000;

const redisClient = new Redis(process.env.REDIS_URL);

//middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

//rate limiter
app.use(gatewayWideLimiter);

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body,  ${JSON.stringify(req.body)}`); //security risk though
  next();
});

//create proxy Shared Proxy
const proxyOptions = {
  proxyReqPathResolver: (req) => {
    //correctly mapping. /v1/auth/login -> /api/auth/login
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy failure : ${err.message}`);

    res.status(500).json({
      message: `Internal server error`,
      error: err.message,
    });
  },
};
// setting up proxy for auth service
app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from identity service: ${proxyRes.statusCode}`,
      );
      return proxyResData;
    },
  }),
);
app.use(errorHandler);

const startServer = async () => {
  try {
    //connect to the database
    //console.log("MONGO_URI:", process.env.MONGO_URI);

    app.listen(port, () => {
      logger.info(`Identity service is listening on port:  ${port}`);
      logger.info(
        `Identity service is is running on port  ${process.env.IDENTITY_SERVICE_URL}`,
      );
      logger.info(`Redis Url:  ${process.env.REDIS_URL}`);
    });
  } catch (error) {
    logger.error("Failed to start gateway", error);
    process.exit(1);
  }
};
startServer();
