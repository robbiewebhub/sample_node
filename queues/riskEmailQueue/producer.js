const connectRabbitMQ = require("../../config/rabbitmq");
const { logger } = require("../../utils/loggerUtils");

const sendToEmailQueue = async (emailData) => {
  const { connection, channel } = await connectRabbitMQ();
  const queue = "emailQueue";

  await channel.assertQueue(queue, { durable: true });

  channel.sendToQueue(queue, Buffer.from(JSON.stringify(emailData)), {
    persistent: true,
  });

  logger.info("Email task sent to queue.");

  await channel.close();
  await connection.close();
};

module.exports = sendToEmailQueue;
