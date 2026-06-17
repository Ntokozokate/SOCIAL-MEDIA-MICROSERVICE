require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const Redis = require("ioredis");
const logger = require("./utils/logger");
const postRoutes = require("./routes/post.routes");
const errorHandler = require("./middleware/error.handler");
const { connectToBD } = require("./config/mongo");
const {
  sensitiveEndPointLimiter,
  globalRateLimiter,
} = require("./middleware/rate.limiter");
const app = express();
const port = process.env.PORT || 3002;

//middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

//Error handler
app.use(errorHandler);

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body,  ${JSON.stringify(req.body)}`); //security risk though
  next();
});
//apply the global limiter
app.use(globalRateLimiter);

//Routes
app.use("/api/posts", postRoutes);
