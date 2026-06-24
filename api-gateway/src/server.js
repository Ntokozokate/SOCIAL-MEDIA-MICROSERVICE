require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const Redis = require("ioredis");
const { rateLimit } = require("express-rate-limit");
const { gatewayWideLimiter } = require("./middleware/rate.limiter");
const proxy = require("express-http-proxy");
const logger = require("./utils/logger");
const errorHandler = require("./middleware/error.handler");
const { authenticateRequest } = require("./middleware/auth.middleware");

const app = express();
const port = process.env.PORT || 3000;

//global middlewares
app.use(helmet());
app.use(cors());

app.use(gatewayWideLimiter);

//gateway Request Logger
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  next();
});

//Shared Base Proxy Options
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

// Public Routes: auth service proxy
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

// Protected Routes: post service proxy(Enforces JWT check first)
app.use(
  "/v1/posts",
  authenticateRequest,
  proxy(process.env.POST_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
      //proxyReqOpts.headers["x-user-role"] = srcReq.user.role;

      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Post service: ${proxyRes.statusCode}`,
      );
      return proxyResData;
    },
  }),
);

app.get("/health", (req, res) => {
  res.status(200).json({
    service: "api-gateway",
    status: "healthy",
  });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    //connect to the database6
    //console.log("MONGO_URI:", process.env.MONGO_URI);

    app.listen(port, () => {
      logger.info(`API gateway is listening on port:  ${port}`);
      logger.info(
        `API gateway is is running on port  ${process.env.IDENTITY_SERVICE_URL}`,
      );
      logger.info(
        `API gateway is is running on port  ${process.env.POST_SERVICE_URL}`,
      );

      logger.info(`Redis Url:  ${process.env.REDIS_URL}`);
    });
  } catch (error) {
    logger.error("Failed to start gateway", error);
    process.exit(1);
  }
};
startServer();
