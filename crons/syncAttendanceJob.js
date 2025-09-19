const cron = require("node-cron");
const { logger } = require("../utils/loggerUtils");
const { Attendance } = require("../models");

const syncAttendanceJob = async () => {
  cron.schedule("0 0 * * *", async () => {
    const data = [
      {
        student_id: 9,
        date: "2024-01-02",
        status: true,
        course_id: 1,
        lecturer: "Ashok",
      },
      {
        student_id: 10,
        date: "2024-01-02",
        status: false,
        course_id: 2,
        lecturer: "Ramesh",
      },
    ];

    try {
      await Attendance.bulkCreate(data);

      logger.info(`Attendance synced successfully.`);
    } catch (error) {
      logger.error("Unable To sync attendance : %s", error.message, {
        stack: error.stack,
      });
    }
  });
};

module.exports = syncAttendanceJob;
