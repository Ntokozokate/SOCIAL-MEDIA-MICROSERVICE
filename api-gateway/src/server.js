require("dotenv").config();
const mongoose = require("mongoose");
const logger = require("./utils/logger");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const Redis = require("ioredis");
const { RedisStore } = require("rate-limit-redis");
const { rateLimit } = require("express-rate-limit");

const app = express();
const port = process.env.PORT || 3000;

const redisClient = new Redis(process.env.REDIS_URL);

//middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
