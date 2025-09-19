const { Student, Course } = require("../models");
const { logger } = require("../utils/loggerUtils");

const getStudentCourse = async (req, res) => {
  try {
    const { studentId } = req.params;

    const studentExist = await Student.findOne({
      where: { id: studentId },
      include: [
        {
          model: Course,
          as: "courses",
        },
      ],
    });

    console.log(studentExist.courses);

    if (!studentExist) {
      return res
        .status(404)
        .json({ success: false, message: "Student does not exist." });
    }

    return res.status(200).json({
      success: true,
      message: "Student courses fetched successfully.",
    });
  } catch (error) {
    logger.error(
      "An error occurred while fetching student courses. : %s",
      error.message,
      { stack: error.stack }
    );
    res.status(500).json({
      success: false,
      message:
        "An error occurred while fetching student courses.Please try again later.",
    });
  }
};

module.exports = { getStudentCourse };
