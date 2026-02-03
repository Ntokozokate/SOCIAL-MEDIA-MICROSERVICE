const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectToBD = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("MongoDB is connected successfully");
  } catch (error) {
    logger.error("MongoDB connection failed", { error });
    process.exit(1);
  }
};

module.exports = { connectToBD };
