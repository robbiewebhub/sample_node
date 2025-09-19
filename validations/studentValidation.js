const { param, query, body } = require("express-validator");
const path = require("path");
const {
  GRADE_LEVEL,
  SEMESTER,
  ENROLLMENT_STATUS,
  GENDER,
  GPA_CONDITION,
  FINANCING,
  ETHNICITY,
  DRAFT_TYPES,
  RISK_LEVEL,
} = require("../config/constants");
const { validateFields } = require("../utils/validationUtils");

const studentValidationRules = {
  getStudents: [
    param("major")
      .optional()
      .isNumeric()
      .withMessage("Please enter valid major."),

    param("gradeLevel")
      .optional()
      .isIn(Object.keys(GRADE_LEVEL))
      .withMessage("Invalid grade value."),

    param("semester")
      .optional()
      .isIn(Object.keys(SEMESTER))
      .withMessage("Please enter valid semester."),

    param("enrollmentStatus")
      .optional()
      .isIn(Object.keys(ENROLLMENT_STATUS))
      .withMessage("Invalid enrollment status"),

    param("gender")
      .optional()
      .isIn(Object.keys(GENDER))
      .withMessage("Invalid gender value."),

    param("age").optional().isNumeric().withMessage("Please enter valid age."),

    param("gpaRange")
      .optional()
      .isIn(Object.keys(GPA_CONDITION))
      .withMessage("Invalid gpa range."),

    param("carelist")
      .optional()
      .isBoolean()
      .withMessage("Invalid carelist field."),
  ],

  getAllStudents: [
    query("page")
      .exists()
      .withMessage("Page field is required.")
      .notEmpty()
      .withMessage("Page field can not be empty.")
      .isNumeric()
      .withMessage("Page field should be in numeric format."),

    query("size")
      .exists()
      .withMessage("Size field is required.")
      .notEmpty()
      .withMessage("Size field can not be empty.")
      .isNumeric()
      .withMessage("Size field should be in numeric format."),

    query("search")
      .optional()
      .notEmpty()
      .withMessage("Search field can not be empty.")
      .isString()
      .withMessage("Search field should be a valid string."),

    query("financing")
      .optional()
      .notEmpty()
      .withMessage("Financing field can not be empty.")
      .isIn(Object.keys(FINANCING))
      .withMessage("Invalid financing value."),

    query("ethnicity")
      .optional()
      .notEmpty()
      .withMessage("Ethnicity field can not be empty.")
      .isIn(Object.keys(ETHNICITY))
      .withMessage("Invalid Ethnicity value."),

    query("unassignedStudents")
      .optional()
      .notEmpty()
      .withMessage("unassigned students field can not be empty.")
      .isBoolean()
      .withMessage("Invalid unassigned students value."),

    query("major")
      .optional()
      .notEmpty()
      .withMessage("Major field can not be empty.")
      .isString()
      .withMessage("Invalid major value."),

    query("gradeLevel")
      .optional()
      .notEmpty()
      .withMessage("Grade level field can not be empty.")
      .isIn(Object.keys(GRADE_LEVEL))
      .withMessage("Invalid grade level value."),

    query("semester")
      .optional()
      .notEmpty()
      .withMessage("Semester field can not be empty.")
      .isIn(Object.keys(SEMESTER))
      .withMessage("Invalid semester value."),

    query("enrollmentStatus")
      .optional()
      .notEmpty()
      .withMessage("Enrollment status field can not be empty.")
      .isIn(Object.keys(ENROLLMENT_STATUS))
      .withMessage("Invalid enrollment status value."),

    query("gender")
      .optional()
      .notEmpty()
      .withMessage("Gender can not be empty.")
      .isIn(Object.keys(GENDER))
      .withMessage("Invalid gender value."),

    query("age")
      .optional()
      .notEmpty()
      .withMessage("Age can not be empty.")
      .isNumeric()
      .withMessage("Invalid age value."),

    query("gpaRange")
      .optional()
      .notEmpty()
      .withMessage("Gpa range can not be empty.")
      .isIn(Object.keys(GPA_CONDITION))
      .withMessage("Invalid gpa range value."),

    query("riskLevel")
      .optional()
      .notEmpty()
      .withMessage("Risk level field can not be empty.")
      .isIn(Object.keys(RISK_LEVEL))
      .withMessage("Invalid risk level field value."),
  ],

  getDemographics: [
    query("startDate")
      .optional()
      .notEmpty()
      .withMessage("Start date field can not be empty.")
      .isDate()
      .withMessage("Invalid start date."),

    query("endDate")
      .optional()
      .notEmpty()
      .withMessage("End date field can not be empty.")
      .isDate()
      .withMessage("Invalid end date."),
  ],

  riskedStudents: [
    query("page")
      .exists()
      .withMessage("Page field is required.")
      .notEmpty()
      .withMessage("Page field can not be empty.")
      .isNumeric()
      .withMessage("Invalid page field value."),

    query("size")
      .exists()
      .withMessage("Size field is required.")
      .notEmpty()
      .withMessage("Size field can not be empty.")
      .isNumeric()
      .withMessage("Invalid size field value."),

    query("search")
      .optional()
      .notEmpty()
      .withMessage("Search field can not be empty."),
  ],

  draftMessages: [
    query("type")
      .exists()
      .withMessage("Type field is required.")
      .notEmpty()
      .withMessage("Type field can not be empty.")
      .isIn(Object.keys(DRAFT_TYPES))
      .withMessage("Invalid type field value."),
  ],

  saveDraft: [
    body("id")
      .optional()
      .notEmpty()
      .withMessage("Id field can not be empty.")
      .isNumeric()
      .withMessage("Invalid id field value."),

    body("type").custom((value, { req }) => {
      if (!req.body.id) {
        if (!value) {
          throw new Error("Type field is required.");
        }
        if (!Object.keys(DRAFT_TYPES).includes(value)) {
          throw new Error("Invalid draft type field value.");
        }
      }
      return true;
    }),
  ],

  sendRiskMail: [
    body("emails")
      .exists()
      .withMessage("Emails field is required.")
      .notEmpty()
      .withMessage("Emails field can not be empty.")
      .isArray()
      .withMessage("Invalid emails field value."),

    body("message")
      .exists()
      .withMessage("Message field is required.")
      .notEmpty()
      .withMessage("Message field can not be empty.")
      .isString()
      .withMessage("Invalid message field value."),

    body("subject")
      .exists()
      .withMessage("Subject field is required.")
      .notEmpty()
      .withMessage("Subject field can not be empty.")
      .isString()
      .withMessage("Invalid subject field value."),

    body("files").custom((value, { req }) => {
      const files = req.files;

      const blockedExtensions = [
        ".exe",
        ".bat",
        ".sh",
        ".cmd",
        ".bin",
        ".dll",
        ".vbs",
      ];

      // Max size in bytes (60MB)
      const maxSize = 60 * 1024 * 1024;

      files.forEach((file) => {
        const fileExt = path.extname(file.originalname).toLowerCase();

        if (blockedExtensions.includes(fileExt)) {
          throw new Error(
            `Executable file type is not allowed: ${file.originalname}.`
          );
        }

        if (file.size > maxSize) {
          throw new Error(
            `File size exceeds the 60MB limit: ${file.originalname}.`
          );
        }
      });

      return true;
    }),
  ],

  addStudentsToCarelist: [
    body("students")
      .exists()
      .withMessage("Students field is required.")
      .notEmpty()
      .withMessage("Students Field can not be empty.")
      .isArray()
      .withMessage("Invalid students field value.")
      .custom((value) => value.length > 0)
      .withMessage("Students field must contain at least one student."),

    validateFields(["students"]),
  ],

  undoStudentsFromCarelist: [
    body("students")
      .exists()
      .withMessage("Students field is required.")
      .notEmpty()
      .withMessage("Students Field can not be empty.")
      .isArray()
      .withMessage("Invalid students field value.")
      .custom((value) => value.length > 0)
      .withMessage("Students field must contain at least one student."),

    validateFields(["students"]),
  ],

  showCarelistStudents: [
    query("page")
      .exists()
      .withMessage("Page field is required.")
      .notEmpty()
      .withMessage("Page Field can not be empty.")
      .isNumeric()
      .withMessage("Invalid page field value."),

    query("size")
      .exists()
      .withMessage("Size field is required.")
      .notEmpty()
      .withMessage("Size Field can not be empty.")
      .isNumeric()
      .withMessage("Invalid size field value."),

    query("search")
      .optional()
      .notEmpty()
      .withMessage("Search Field can not be empty.")
      .isString()
      .withMessage("Invalid search field value."),

    validateFields(["page", "size", "search"]),
  ],
};

module.exports = studentValidationRules;
