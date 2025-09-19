const { body } = require("express-validator");
const { validateFields } = require("../utils/validationUtils");

const authValidationRules = {
  login: [
    body("email")
      .exists()
      .withMessage("Please enter your email")
      .normalizeEmail(),

    body("password").exists().withMessage("Please enter your password"),

    validateFields(["email", "password"]),
  ],

  resetPassword: [
    body("newPassword")
      .exists()
      .withMessage("Password field is mandatory.")
      .notEmpty()
      .withMessage("Please enter your password")
      .isLength({ min: 12 })
      .withMessage("Password must be atleast 12 characters long."),
  ],

  changePassword: [
    body("password")
      .exists()
      .withMessage("Password field is mandatory.")
      .notEmpty()
      .withMessage("Please enter your password")
      .isLength({ min: 12 })
      .withMessage("Password must be atleast 12 characters long."),
  ],

  loginAsAdmin: [
    body("campusId")
      .exists()
      .withMessage("CampusId field is required.")
      .notEmpty()
      .withMessage("Please enter campusId.")
      .isNumeric()
      .withMessage("CampusId should be in numeric."),

    validateFields(["campusId"]),
  ],

  isValidToken: [
    body("token")
      .exists()
      .withMessage("Token is required")
      .notEmpty()
      .withMessage("Please enter token."),

    validateFields(["token"]),
  ],
};

module.exports = authValidationRules;
