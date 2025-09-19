const connectRabbitMQ = require("../../config/rabbitmq");
const { sendRiskStudentEmail } = require("../../utils/emailUtils");
const { logger } = require("../../utils/loggerUtils");

const startEmailWorker = async () => {
  const { connection, channel } = await connectRabbitMQ();
  const queue = "emailQueue";

  await channel.assertQueue(queue, { durable: true });

  logger.info("Waiting for email tasks...");

  channel.consume(
    queue,

    async (msg) => {
      if (msg !== null) {
        const { students, message, subject, attachments } = JSON.parse(
          msg.content.toString()
        );

        try {
          for (const student of students) {
            const content = message
              .replace("{studentName}", student.name)
              .replace("{studentId}", student.id)
              .replace("{studentYear}", student.year)
              .replace("{studentSemester}", student.semester)
              .replace("{riskLevel}", student.riskLevel)
              .replace("{advisorName}", student.advisorName)
              .replace("{advisorPhone}", student.advisorPhone)
              .replace("{advisorEmail}", student.advisorEmail)
              .replace("{collegeName}", student.collegeName)
              .replace("{collegeAddress}", student.collegeAddress)
              .replace("{collegeContact}", student.collegeContact);

            const emailData = {
              email: student.email,
              subject,
              message: content,
            };

            if (student?.advisors?.email) {
              emailData.cc = [student.advisors.email];
            }

            await sendRiskStudentEmail(
              emailData.email,
              emailData.message,
              emailData.subject,
              attachments ?? [],
              emailData.cc
            );

            logger.info(`Email sent to: ${emailData.email}`);
          }

          channel.ack(msg);
        } catch (error) {
          logger.error("Error sending email: %s", error.message, {
            satck: error.stack,
          });
          channel.nack(msg);
        }
      }
    },
    { noAck: false }
  );
};

module.exports = startEmailWorker;
