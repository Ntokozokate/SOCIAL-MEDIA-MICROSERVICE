require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const Redis = require("ioredis");
const logger = require("./utils/logger");
const routes = require("./routers/identity.service");
const errorHandler = require("./middleware/error.handler");
const { connectToBD } = require("./config/mongo");
const {
  sensitiveEndPointLimiter,
  globalRateLimiter,
} = require("./middleware/rate.limiter");

const app = express();
const port = process.env.PORT || 3001;

//connect to the database
connectToBD();
//console.log("MONGO_URI:", process.env.MONGO_URI);

//middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body,  ${JSON.stringify(req.body)}`); //security risk though
  next();
});
//apply the global limiter
app.use(globalRateLimiter);

//Routes
app.use("/api/auth", routes);

//Error handler
app.use(errorHandler);

//start server
app.listen(port, () => {
  logger.info(`Identity service is listening on port:  ${port}`);
});

// unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
  logger.error("unhandledRejection at ", promise, "reason:", reason);
});
