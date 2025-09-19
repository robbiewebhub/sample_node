const dotenv = require("dotenv");
const amqp = require("amqplib");

const connectRabbitMQ = async () => {
  const connection = await amqp.connect(process.env.RABBITMQ_URI);
  const channel = await connection.createChannel();
  return { connection, channel };
};

module.exports = connectRabbitMQ;
