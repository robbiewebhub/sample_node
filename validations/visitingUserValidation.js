const { body } = require("express-validator");
const { validateFields } = require("../utils/validationUtils");
const e = require("express");

const visitingUserValidationRules = {
  createUser: [
    body("fullName")
      .exists()
      .withMessage("Full name field is required.")
      .notEmpty()
      .withMessage("Full name cannot be empty.")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Invalid full name value.")
      .trim(),

    body("email")
      .exists()
      .withMessage("Email field is required.")
      .notEmpty()
      .withMessage("Please enter valid email.")
      .normalizeEmail(),

    body("phone")
      .exists()
      .withMessage("Phone field is required.")
      .notEmpty()
      .withMessage("Invalid phone number.")
      .isMobilePhone()
      .withMessage("Invalid phone number."),

    body("university")
      .exists()
      .withMessage("University field is required.")
      .notEmpty()
      .withMessage("Invalid university value.")
      .isString()
      .withMessage("Invalid university value.")
      .trim(),

    validateFields(["fullName", "email", "phone", "university"]),
  ],
};

module.exports = visitingUserValidationRules;
