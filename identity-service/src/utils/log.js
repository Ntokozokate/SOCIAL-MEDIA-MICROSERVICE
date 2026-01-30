const winston = require("winston");
const { combine, timestamp, errors, json } = winston.format;
const isProduction = process.env.NODE_ENV === "production";

const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  format: combine(
    timestamp(),
    errors({ stack: true }), // include stack trace
    json(),
  ),

  defaultMeta: {
    service: "identity-service",
  },

  transports: [
    // Always log errors to a file
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),

    // Log everything to combined file
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  ],
});

// In development, also log to console
if (!isProduction) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  );
}

module.exports = logger;
