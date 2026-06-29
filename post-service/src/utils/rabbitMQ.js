const amqp = require("amqplib");

const logger = require("./logger");

let connection = null;
let channel = null;

const EXCHANGE_NAME = "facebook_events";

async function connectToRabbitMQ() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    //listeen for diconnections
    connection.on("error", (err) => {
      logger.error(
        "RabbitMQ connection error occurred, attempting reconnect...",
        err,
      );
      setTimeout(connectToRabbitMQ, 5000);
    });

    connection.on("close", () => {
      logger.info(
        "RabbitMQ connection error occurred, attempting reconnect...",
      );
      setTimeout(connectToRabbitMQ, 5000); // Try to reconnect in 5 seconds
    });

    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });
    logger.info("Connected to rabbit mq");
    return channel;
  } catch (e) {
    logger.error("Error connecting to rabbit mq", e);
    // If the initial boot fails, try again in 5 seconds
    setTimeout(connectToRabbitMQ, 5000);
  }
}

async function publishEvent(routingKey, message) {
  if (!channel) {
    //trigger a connection
    logger.warn(
      "Channel not open. Attempting to reconnect efore publishing...",
    );
    await connectToRabbitMQ();
  }
  //checking if the connection attempt was made, if not safely exit
  if (!channel) {
    logger.error(
      `Failed to publish event ${routingKey}: Message broker is offline.`,
    );
    return;
  }

  try {
    channel.publish(
      EXCHANGE_NAME,
      routingKey,
      Buffer.from(JSON.stringify(message)),
    );
    logger.info(`Event published: ${routingKey}`);
  } catch (error) {
    logger.error("Failed to publish even:", error);
  }
}

module.exports = { connectToRabbitMQ, publishEvent };
