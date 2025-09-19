const deleteModelJob = require("./deleteModelJob");
const syncAttendanceJob = require("./syncAttendanceJob");

const startCronJobs = () => {
  deleteModelJob();
  syncAttendanceJob();
};

module.exports = startCronJobs;
