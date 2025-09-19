const { body } = require("express-validator");
const { validateFields } = require("../utils/validationUtils");
const { USER_PREFIX } = require("../config/constants");

const campusValidationRules = {
  createCampus: [
    body("name")
      .exists()
      .withMessage("Campus name feild is required.")
      .notEmpty()
      .withMessage("Please enter campus name.")
      .isString()
      .withMessage("Campus name should be string.")
      .trim()
      .escape(),

    body("email")
      .exists()
      .withMessage("Campus email feild is required.")
      .notEmpty()
      .withMessage("Please enter campus email.")
      .isEmail()
      .withMessage("Invalid Email Address")
      .normalizeEmail(),

    body("phone")
      .exists()
      .withMessage("Campus phone feild is required.")
      .notEmpty()
      .withMessage("Please enter campus phone.")
      .isMobilePhone()
      .withMessage("Invalid phone number"),

    body("address")
      .exists()
      .withMessage("Campus address feild is required.")
      .notEmpty()
      .withMessage("Please enter campus address.")
      .isString()
      .withMessage("Campus address should be in string.")
      .trim(),

    body("website")
      .exists()
      .withMessage("Campus website feild is required.")
      .notEmpty()
      .withMessage("Please enter campus website.")
      .isURL()
      .withMessage("Invalid campus website.")
      .trim(),

    body("president_prefix")
      .exists()
      .withMessage("President prefix feild is required.")
      .notEmpty()
      .withMessage("Please enter president prefix.")
      .isIn(Object.keys(USER_PREFIX))
      .withMessage("Invalid president prefix."),

    body("president_first_name")
      .exists()
      .withMessage("President first name feild is required.")
      .notEmpty()
      .withMessage("Please enter president first name.")
      .isString()
      .withMessage("Invalid president first name."),

    body("president_last_name")
      .exists()
      .withMessage("President last name feild is required.")
      .notEmpty()
      .withMessage("Please enter president last name.")
      .isString()
      .withMessage("Invalid president last name."),

    body("universityId")
      .exists()
      .withMessage("UniversityId field is required.")
      .notEmpty()
      .withMessage("Please enter university id.")
      .isNumeric()
      .withMessage("Invalid university id."),

    validateFields([
      "name",
      "email",
      "phone",
      "website",
      "address",
      "president_prefix",
      "president_first_name",
      "president_last_name",
      "universityId",
    ]),
  ],

  updateCampusStatus: [
    body("campusId")
      .exists()
      .withMessage("CampusId field is required.")
      .notEmpty()
      .withMessage("Please enter campusId.")
      .isNumeric()
      .withMessage("CampusId should be in numeric."),

    body("isActivate")
      .exists()
      .withMessage("Is activated field is required.")
      .notEmpty()
      .withMessage("Please enter isActivated value.")
      .isBoolean()
      .withMessage("Invalid isActivated Value"),

    validateFields(["campusId", "isActivate"]),
  ],

  update: [
    body("universityId")
      .optional()
      .notEmpty()
      .withMessage("Please enter universityId.")
      .isNumeric()
      .withMessage("UniversityId should be numeric"),

    body("campusId")
      .exists()
      .withMessage("CampusId field is required.")
      .notEmpty()
      .withMessage("Please enter campusId.")
      .isNumeric()
      .withMessage("CampusId should be numeric"),

    body("name")
      .optional()
      .isString()
      .withMessage("Invalid campus name.")
      .trim()
      .escape(),

    body("phone")
      .optional()
      .isMobilePhone()
      .withMessage("Invalid campus phone number.")
      .trim(),

    body("address")
      .optional()
      .isString()
      .withMessage("Invalid campus address.")
      .trim(),

    body("website")
      .optional()
      .isURL()
      .withMessage("Invalid campus website url.")
      .trim(),

    body("presidentPrefix")
      .optional()
      .isIn(Object.keys(USER_PREFIX))
      .withMessage("Invalid president prefix."),

    body("presidentFirstName")
      .optional()
      .isString()
      .withMessage("Invalid president first name.")
      .trim()
      .escape(),

    body("presidentLastName")
      .optional()
      .isString()
      .withMessage("Invalid president last name.")
      .trim()
      .escape(),

    validateFields(
      [
        "universityId",
        "campusId",
        "name",
        "phone",
        "address",
        "website",
        "presidentPrefix",
        "presidentFirstName",
        "presidentLastName",
      ],
      {},
      true
    ),
  ],

  updateDefaultCampus: [
    body("campusId")
      .exists()
      .withMessage("Campus Id field is required.")
      .notEmpty()
      .withMessage("Campus Id field is required.")
      .isInt()
      .withMessage("Invalid campus Id."),

    validateFields(["campusId"]),
  ],
};

module.exports = campusValidationRules;
