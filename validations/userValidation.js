const { body, param } = require("express-validator");
const { USER_PREFIX } = require("../config/constants");
const { validateFields } = require("../utils/validationUtils");

const userValidationRules = {
  changeUserStatus: [
    body("userId")
      .exists()
      .withMessage("User Id Field is required.")
      .notEmpty()
      .withMessage("Please enter User Id.")
      .isNumeric()
      .withMessage("User Id should be in numeric."),

    body("isActivate")
      .exists()
      .withMessage("Is activated field is required.")
      .notEmpty()
      .withMessage("Please enter isActivated value.")
      .isBoolean()
      .withMessage("Invalid isActivated Value"),

    body("reAssignStudents")
      .optional()
      .isBoolean()
      .withMessage("Invalid Reassign field.")
      .custom((value, { req }) => {
        if (value === true && !req.body.reAssignTo) {
          throw new Error(
            "reAssignTo field is required when reAssignStudents is true."
          );
        }
        return true;
      }),

    body("reAssignTo")
      .optional()
      .isNumeric()
      .withMessage("Invalid reAssignTo value."),

    validateFields(["userId", "isActivate", "reAssignStudents", "reAssignTo"]),
  ],

  updateUser: [
    body("userId")
      .notEmpty()
      .withMessage("Please Enter userId.")
      .isNumeric()
      .withMessage("Invalid userId.")
      .toInt(),

    body("prefix")
      .optional()
      .isIn(Object.keys(USER_PREFIX))
      .withMessage("Invalid prefix value."),

    body("firstName")
      .optional()
      .isString()
      .withMessage("Invalid first name.")
      .trim()
      .escape(),

    body("lastName")
      .optional()
      .isString()
      .withMessage("Invalid last name.")
      .trim()
      .escape(),

    body("roleId").optional().isNumeric().withMessage("Invalid Role").toInt(),

    body("phone")
      .optional()
      .isMobilePhone()
      .withMessage("Invalid phone number.")
      .trim()
      .escape(),

    validateFields(
      [
        "userId",
        "prefix",
        "firstName",
        "lastName",
        "roleId",
        "phone",
        "departmentId",
      ],
      {},
      true
    ),
  ],

  getUserById: [
    param("userId")
      .exists()
      .withMessage("UserId field is require.")
      .notEmpty()
      .withMessage("Please enter a valid userId.")
      .isNumeric()
      .withMessage("Invalid userId.")
      .toInt(),
  ],

  getDepartmentByRole: [
    param("roleId")
      .exists()
      .withMessage("RoleId field is required.")
      .notEmpty()
      .withMessage("Please enter a valid RoleId.")
      .isNumeric()
      .withMessage("Invalid roleId.")
      .toInt(),
  ],

  deleteUser: [
    body("userId")
      .exists()
      .withMessage("UserId field is required.")
      .notEmpty()
      .withMessage("Please enter userId.")
      .isNumeric()
      .withMessage("Invalid userId."),

    body("reAssignStudents")
      .optional()
      .isBoolean()
      .withMessage("Invalid Reassign field.")
      .custom((value, { req }) => {
        if (value === true && !req.body.reAssignTo) {
          throw new Error(
            "reAssignTo field is required when reAssignStudents is true."
          );
        }
        return true;
      }),

    body("reAssignTo")
      .optional()
      .isNumeric()
      .withMessage("Invalid reAssignTo value."),

    validateFields(["userId", "reAssignStudents", "reAssignTo"]),
  ],

  assignStudents: [
    body("managerId")
      .exists()
      .withMessage("ManagerId field is required.")
      .notEmpty()
      .withMessage("Please enter manager id.")
      .isNumeric()
      .withMessage("Invalid manager id."),

    body("students")
      .exists()
      .withMessage("Students field is required.")
      .notEmpty()
      .withMessage("Please enter students list.")
      .isArray()
      .withMessage("Invalid students list.")
      .custom((value) => value.length > 0)
      .withMessage("Students list must not be empty"),

    validateFields(["managerId", "students"]),
  ],
};

module.exports = userValidationRules;
