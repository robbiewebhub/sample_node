const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { hashPassword, verifyPassword } = require("../utils/hashUtils");
const emailService = require("../utils/emailUtils");
const { Role, User, Campus, University } = require("../models");
const {
  ROLES_MAPPING: { SUPER_ADMIN, ADMIN },
} = require("../config/constants");
const { logger } = require("../utils/loggerUtils");
require("dotenv").config();

const loginController = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User doesn't exist." });
    }

    const userUniversity = await user?.getUniversity();

    if (user.role_id !== SUPER_ADMIN && !userUniversity.is_activated) {
      return res
        .status(400)
        .json({ success: false, message: "University status is inactive." });
    }

    const userCampus = await user?.getCampus();

    if (
      user.role_id !== SUPER_ADMIN &&
      user.role_id !== ADMIN &&
      !userCampus.is_activate
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Campus status is inactive." });
    }

    const userAttempts = user.attempts;
    let current_attempt;
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      if (userAttempts == null || "" || 0) {
        current_attempt = 1;
      } else if (userAttempts < 5) {
        current_attempt = userAttempts + 1;
      } else {
        return res.status(401).json({
          success: false,
          message: `We've noticed multiple unsuccessful login attempts. For your security, please reset your password to regain access.`,
        });
      }
      const attemtsUpdate = await user.update({ attempts: current_attempt });

      return res.status(401).json({
        success: false,
        message: `Invalid credentials you have only ${
          5 - userAttempts
        } attempts`,
      });
    }

    const attemtsUpdate = await user.update({ attempts: 0 });

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role_id,
        campusId: userCampus?.id,
        universityId: userUniversity?.id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      roleId: user.role_id,
    });
  } catch (error) {
    logger.error("An error occured while login : %s", error.message, {
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "An error occured while login." });
  }
};

const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;

const forgotPasswordController = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email is not found",
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const resetLink = `${FRONTEND_URL}/new-password/${token}`;

    await emailService.sendResetPasswordEmail(email, resetLink);

    res
      .status(200)
      .json({ success: true, message: "Password reset link sent" });
  } catch (error) {
    console.error("Error in forgotPasswordController:", error);
    res.status(500).send("Failed to send email");
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const userId = decoded.id;

    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await user.update({ password: hashedPassword });

    if (updatedUser) {
      const attemtsUpdate = await user.update({ attempts: 0 });

      res.json({ success: true, message: "Password reset successfully" });
    } else {
      res.status(500).send("Failed to reset password");
    }
  } catch (error) {
    console.error("Error during token verification or password reset:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(400).send("Invalid token");
    }
    if (error.name === "TokenExpiredError") {
      return res.status(400).send("Token expired");
    }
    res.status(500).send("An error occurred");
  }
};

const ChangePassword = async (req, res) => {
  try {
    const { oldPassword, password } = req.body;
    const userId = req.loggedInUser.id;
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    if (user) {
      const isOldPasswordMatch = await verifyPassword(
        oldPassword,
        user.password
      );
      if (!isOldPasswordMatch) {
        return res
          .status(400)
          .json({ success: false, message: "Current password is not correct" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const updatedUser = await user.update({ password: hashedPassword });
    if (updatedUser) {
      res.status(200).json({
        success: true,
        message: "Password has been changed successfully",
      });
    }
  } catch (err) {
    logger.error("An error occurred while changing password: %s", err.message, {
      stack: err.stack,
    });

    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const loginAsAdminController = async (req, res) => {
  try {
    const { campusId } = req.body;
    const { loggedInUser } = req;

    if (
      loggedInUser.role !== SUPER_ADMIN ||
      (loggedInUser.role === SUPER_ADMIN && loggedInUser?.campusId)
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized for logged in as admin.",
      });
    }

    const existedCampus = await Campus.findOne({ where: { id: campusId } });

    if (!existedCampus) {
      return res.status(404).json({
        success: false,
        message: "Campus does not exist.",
      });
    }

    if (!existedCampus.is_activate) {
      return res.status(400).json({
        success: false,
        message: "Campus status is inactive.",
      });
    }

    const existedUniversity = await University.findOne({
      where: { id: existedCampus.university_id },
    });

    if (!existedUniversity) {
      return res.status(404).json({
        success: false,
        message: "University does not exist.",
      });
    }

    if (!existedUniversity.is_activated) {
      return res.status(400).json({
        success: false,
        message: "University status is inactive.",
      });
    }
    const token = jwt.sign(
      {
        id: loggedInUser.id,
        role: loggedInUser.role,
        campusId,
        universityId: existedUniversity.id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        campusId: existedCampus.id,
      },
    });
  } catch (error) {
    logger.error(
      "An error occurred while logged in as admin: %s",
      error.message,
      {
        stack: error.stack,
      }
    );

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while logged in as admin. Please try again later.",
    });
  }
};

const isValidTokenController = async (req, res) => {
  try {
    const { token } = req.body;

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "Invalid token",
          auth: false,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Token is valid.",
        auth: true,
      });
    });
  } catch (error) {
    logger.error(
      "An error occurred while checking token is valid or not: %s",
      error.message,
      {
        stack: error.stack,
      }
    );

    return res.status(500).json({
      success: false,
      message:
        "An error occurred while checking token is valid or not. Please try again later.",
    });
  }
};

module.exports = {
  loginController,
  forgotPasswordController,
  resetPassword,
  ChangePassword,
  loginAsAdminController,
  isValidTokenController,
};
