const startEmailWorker = require("./queues/riskEmailQueue/consumer");
const { logger } = require("./utils/loggerUtils");

const startWorkers = async () => {
  try {
    await startEmailWorker(); // Start the email worker
  } catch (err) {
    logger.error("An error occurred while starting workers: %s", err.message, {
      stack: err.stack,
    });
  }
};

startWorkers();
