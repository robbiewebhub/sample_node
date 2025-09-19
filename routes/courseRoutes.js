const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authmiddleware");

const { getStudentCourse } = require("../controllers/courseController");

router.get("/:studentId", authMiddleware, getStudentCourse);

module.exports = router;
