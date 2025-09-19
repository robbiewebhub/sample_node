const { body } = require("express-validator");
const { validateFields } = require("../utils/validationUtils");
const { USER_PREFIX } = require("../config/constants");

const universityValidationRules = {
  createUniversity: [
    body("name")
      .exists()
      .withMessage("Name field id required.")
      .notEmpty()
      .withMessage("University name cannot be empty.")
      .isString()
      .withMessage("University name must be a valid string.")
      .trim(),

    body("email")
      .exists()
      .withMessage("Email field id required.")
      .notEmpty()
      .withMessage("University email cannot be empty.")
      .isEmail()
      .withMessage("University email must be a valid email address.")
      .normalizeEmail(),

    body("phone")
      .exists()
      .withMessage("Phone field id required.")
      .notEmpty()
      .withMessage("University phone cannot be empty.")
      .isMobilePhone()
      .withMessage("University phone must be a valid phone number.")
      .trim(),

    body("website")
      .exists()
      .withMessage("Website field id required.")
      .notEmpty()
      .withMessage("University website cannot be empty.")
      .isURL()
      .withMessage("University website must be a valid url.")
      .trim(),

    body("address")
      .exists()
      .withMessage("Address field id required.")
      .notEmpty()
      .withMessage("University address cannot be empty.")
      .isString()
      .withMessage("University address must be a valid string.")
      .trim(),

    body("user")
      .exists()
      .withMessage("User details is required.")
      .isObject()
      .withMessage("Invalid user details."),

    body("user.prefix")
      .exists()
      .withMessage("User prefix feild is required.")
      .notEmpty()
      .withMessage("Please enter user prefix.")
      .isIn(Object.keys(USER_PREFIX))
      .withMessage("Invalid user prefix."),

    body("user.firstName")
      .exists()
      .withMessage("User first name feild is required.")
      .notEmpty()
      .withMessage("Please enter user first name.")
      .isString()
      .withMessage("Invalid user first name.")
      .trim()
      .escape(),

    body("user.lastName")
      .exists()
      .withMessage("User last name feild is required.")
      .notEmpty()
      .withMessage("Please enter user last name.")
      .isString()
      .withMessage("Invalid user last name.")
      .trim()
      .escape(),

    body("user.email")
      .exists()
      .withMessage("User email feild is required.")
      .notEmpty()
      .withMessage("Please enter user email.")
      .isEmail()
      .withMessage("Invalid Email Address")
      .normalizeEmail(),

    body("user.phone")
      .exists()
      .withMessage("User phone feild is required.")
      .notEmpty()
      .withMessage("Please enter user phone.")
      .isMobilePhone()
      .withMessage("Invalid phone number"),

    body("user.password")
      .exists()
      .withMessage("User password feild is required.")
      .notEmpty()
      .withMessage("Please enter user password.")
      .isLength({ min: 12 })
      .withMessage("Password must be at least 12 characters long."),

    validateFields(["name", "email", "phone", "website", "address", "user"], {
      user: ["prefix", "firstName", "lastName", "email", "phone", "password"],
    }),
  ],

  updateUniversity: [
    body("id").isNumeric().withMessage("Invalid university id."),

    body("name")
      .optional()
      .isString()
      .withMessage("University name must be a valid string.")
      .trim(),

    body("email")
      .optional()
      .isEmail()
      .withMessage("University email must be a valid email address.")
      .normalizeEmail(),

    body("phone")
      .optional()
      .isMobilePhone()
      .withMessage("University phone must be a valid phone number.")
      .trim(),

    body("website")
      .optional()
      .isURL()
      .withMessage("University website must be a valid url.")
      .trim(),

    body("address")
      .optional()
      .isString()
      .withMessage("University address must be a valid string.")
      .trim(),

    body("user").optional().isObject().withMessage("Invalid user details."),

    body("user.prefix")
      .optional()
      .isIn(Object.keys(USER_PREFIX))
      .withMessage("Invalid user prefix."),

    body("user.firstName")
      .optional()
      .isString()
      .withMessage("Invalid user first name.")
      .trim()
      .escape(),

    body("user.lastName")
      .optional()
      .isString()
      .withMessage("Invalid user last name.")
      .trim()
      .escape(),

    body("user.phone")
      .optional()
      .isMobilePhone()
      .withMessage("Invalid campus phone number.")
      .trim(),

    validateFields(
      ["id", "name", "email", "phone", "website", "address", "user"],
      {
        user: ["", "prefix", "firstName", "lastName", "phone"],
      },
      true
    ),
  ],

  changeStatusUniversity: [
    body("id")
      .exists("UniversityId field is required")
      .notEmpty()
      .withMessage("UniversityId can not be empty")
      .isNumeric()
      .withMessage("Invalid university id."),

    body("isActivated")
      .exists("isActivated field is required")
      .notEmpty()
      .withMessage("IsActivated can not be empty")
      .isBoolean()
      .withMessage("Invalid isActivated value."),
  ],
};

module.exports = universityValidationRules;
