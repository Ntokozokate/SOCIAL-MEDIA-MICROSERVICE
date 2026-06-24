require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
//const Redis = require("ioredis");
const logger = require("./utils/logger");
const postRoutes = require("./routes/post.routes");
const errorHandler = require("./middleware/error.handler");
const { connectToBD } = require("./config/mongo");
const { globalRateLimiter } = require("./middleware/rate.limiter");

const app = express();
const port = process.env.PORT || 3002;

//Core security middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Add trust proxy because we will be using API gateway
app.set("trust proxy", 1);

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  next();
});

//apply the global limiter
app.use(globalRateLimiter);

//Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    service: "post-service",
    status: "healthy",
  });
});

//Application routes
app.use("/api/posts", postRoutes);
//for the posts routes remember to put sensitiveEndPointLimiter manually because
// the rate limiter we hv is very restrictive to be applied to all routes ,
//  also consider using a different limiter

//Global Error handler
app.use(errorHandler);

//Start the server only when its ready
let server;
const startServer = async () => {
  //connect to the database
  await connectToBD();

  server = app.listen(port, () => {
    logger.info(`Post Service is listening on port:  ${port}`);
  });
};

startServer().catch((err) => {
  logger.error("Failed to start Post service:", err);
  process.exit(1);
});

////gracefull shutdown

// unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
  logger.error("unhandledRejection at ", promise, "reason:", reason);
});

// uncaught exceptions

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception thrown:", err);
  // In production, always exit and let Docker/Kubernetes restart the container
  process.exit(1);
});
