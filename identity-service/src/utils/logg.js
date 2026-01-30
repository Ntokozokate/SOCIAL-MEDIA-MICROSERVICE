const winston = require("winston");
require("winston-daily-rotate-file");

//define the log levels ||If you do not define these levels there are default levels that will be used

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};
// set level based on environment
const level = () => {
  const env = process.env.NODE_ENV || "environment";
  return env === "development" ? "debug" : "warn";
};

// define the format
const format = winston.format.combine(
  winston.format.timestamp({ format: "DD-MM-YYYY HH:mms:ss:ms" }),
  winston.format.errors({ stack: true }),
  winston.format.json(), //Production standard: Machine-readable
);

//Define the transports (Where logs go)
const transports = [
  //Console for real time debugging
  new winston.transport.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) =>
          `${info.timestamp} ${info.level}: ${info.message}${info.stack ? "\n" + info.stack : ""}`,
      ),
    ),
  }),
  // Daily Rotate: For production persistence
  new winston.transports.DailyRotateFile({
    filename: "logs/error-%DATE%.log",
    level: "error", // only log errors to this file
    datePattern: "DD-MM-YYYY",
    zippedArchive: true, // Save space
    maxSize: "20m", // rotte of file is greater than 20mb
    maxFiles: "14d", //Keep the ;ogs for 14 days
  }),
  new winston.transports.DailyRotateFile({
    filename: "logs/combined-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "30d",
  }),
];

//create the logger instnce
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});
module.exports = logger;
