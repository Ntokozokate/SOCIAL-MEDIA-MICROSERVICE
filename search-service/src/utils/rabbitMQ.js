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
  } catch (error) {
    logger.error("Error connecting to rabbit mq", error);
    // If the initial boot fails, try again in 5 seconds
    setTimeout(connectToRabbitMQ, 5000);
  }
}

async function consumeEvent(routingKey, callback) {
  if (!channel) {
    await connectToRabbitMQ();
  }
  const queueName = "search_service_events";

  //set durable: true(Or falseto match the exchange , but never exclusive )
  await channel.assertQueue(queueName, { durable: false }); //durability must match boilerplate

  //bind this permanent queue
  await channel.bindQueue(queueName, EXCHANGE_NAME, routingKey);

  //consume from the permanent queue
  channel.consume(queueName, (msg) => {
    if (msg !== null) {
      try {
        const content = JSON.parse(msg.content.toString());
        callback(content);
        channel.ack(msg);
      } catch (error) {
        logger.error("Error processing message, rejecting", error);
        // nack prevents the app from hanging if a message has bad syntax
        channel.nack(msg, false, false);
      }
    }
  });

  logger.info(`Subscribed to event: ${routingKey} via queue: {queueName}`);
}

module.exports = { connectToRabbitMQ, consumeEvent };

//NOTES {exclusive: true}
// should never be used in the search service because
// the search service is a stateful data syncronizer
// so the service needs to mirror what is available in the corresponding services
