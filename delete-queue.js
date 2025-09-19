require("dotenv");
const amqp = require("amqplib");
const { default: axios } = require("axios");

async function deleteQueue(queueName) {
  try {
    // Connect to the RabbitMQ server
    const connection = await amqp.connect(process.env.RABBITMQ_URI); // Replace with your RabbitMQ connection string
    const channel = await connection.createChannel();

    // Delete the queue
    await channel.deleteQueue(queueName, { ifUnused: false, ifEmpty: false });
    console.log(`Queue '${queueName}' deleted successfully.`);

    // Close the channel and connection
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error("Error deleting queue:", error);
  }
}

deleteQueue("emailQueue"); // Replace with the name of the queue you want to deleteconst amqp = require('amqplib');

async function checkQueueStatus(queueName) {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URI); // Use your connection URL if needed
    const channel = await connection.createChannel();

    // Check if the queue exists by asserting it
    const ok = await channel.assertQueue(queueName, { passive: true });

    if (ok) {
      console.log(`Queue '${queueName}' exists.`);
    } else {
      console.log(`Queue '${queueName}' does not exist.`);
    }

    // Close the channel and connection
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error("Error checking queue status:", error);
  }
}

// Check if a specific queue exists
// checkQueueStatus("emailQueue"); // Replace with your queue name

async function checkQueue(queueName) {
  try {
    // Establish connection with RabbitMQ server
    const connection = await amqp.connect("amqp://localhost"); // Update with your RabbitMQ URL if different
    const channel = await connection.createChannel();

    // Ensure the queue exists (this doesn't create it, just checks its properties)
    const queue = await channel.assertQueue(queueName, { passive: true });

    // Get the number of messages in the queue
    console.log(`Queue '${queueName}' exists.`);
    console.log(`Messages in the queue: ${queue.messageCount}`);
    console.log(`Consumers attached: ${queue.consumerCount}`);

    // Optionally, start consuming messages if you want to track processing activity
    // channel.consume(queueName, (msg) => {
    //   if (msg) {
    //     console.log(`Received message: ${msg.content.toString()}`);
    //     channel.ack(msg); // Acknowledge the message (remove from the queue)
    //   }
    // });

    // Close the connection after a brief delay (or after a certain condition is met)
    setTimeout(async () => {
      await channel.close();
      await connection.close();
    }, 5000); // Close after 5 seconds
  } catch (error) {
    console.error("Error interacting with the queue:", error);
  }
}

// Replace with your queue name
checkQueue("emailQueue"); // Replace 'your_queue_name' with the name of the queue you want to check
