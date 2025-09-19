const { Major } = require("../models");

const getAllMajorsController = async (req, res) => {
  try {
    const majors = await Major.findAll();

    return res
      .status(200)
      .json({
        success: true,
        message: "Major fetched successfully.",
        data: majors,
      });
  } catch (error) {
    logger.error("An error occured while fetching major : %s", error.message, {
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while fetching major. Please try again later.",
    });
  }
};

module.exports = {
  getAllMajorsController,
};
