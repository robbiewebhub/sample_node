const { Op } = require("sequelize");
const { VisitingUser } = require("../models");
const { sendVisitingUserEmail } = require("../utils/emailUtils");
const { logger } = require("../utils/loggerUtils");

const createVisitingUserController = async (req, res) => {
  try {
    const { fullName, email, phone, university } = req.body;

    await VisitingUser.create({
      full_name: fullName,
      email,
      phone,
      university,
    });

    await sendVisitingUserEmail({ fullName, email, phone, university });

    return res.status(201).json({
      success: true,
      message: "User details saved successfully.",
    });
  } catch (error) {
    logger.error(
      "An error occured while creating visiting user : %s",
      error.message,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while creating visiting user. Please try again later.",
    });
  }
};

module.exports = {
  createVisitingUserController,
};
