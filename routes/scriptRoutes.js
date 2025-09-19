const express = require("express");
const router = express.Router();

const { insertStudents } = require("../scripts/generateStudents");

router.get("/generate-students/:count", insertStudents);
module.exports = router;
