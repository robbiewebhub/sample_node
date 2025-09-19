const { body } = require("express-validator");
const fs = require("fs");
const { validateFields } = require("../utils/validationUtils");
const { USER_PREFIX } = require("../config/constants");

const modelValidationRules = {
  deleteModel: [
    body("modelId")
      .exists()
      .withMessage("ModelId feild is required.")
      .notEmpty()
      .withMessage("Please enter modelId.")
      .isString()
      .withMessage("Invalid modelId.")
      .trim(),

    validateFields(["modelId"]),
  ],

  uploadModel: [
    body("file").custom((value, { req }) => {
      if (!req.file) {
        throw new Error("No file uploaded");
      }

      const allowedMimeTypes = ["text/csv", "application/vnd.ms-excel"];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        fs.unlinkSync(req.file.path);
        throw new Error("Invalid file type. Only CSV files are allowed.");
      }

      return true;
    }),

    validateFields("file"),
  ],

  setDefaultModel: [
    body("modelId")
      .exists()
      .withMessage("ModelId feild is required.")
      .notEmpty()
      .withMessage("Please enter modelId.")
      .isString()
      .withMessage("Invalid modelId.")
      .trim(),

    validateFields(["modelId"]),
  ],

  restoreModel: [
    body("modelId")
      .exists()
      .withMessage("ModelId feild is required.")
      .notEmpty()
      .withMessage("Please enter modelId.")
      .isString()
      .withMessage("Invalid modelId.")
      .trim(),

    validateFields(["modelId"]),
  ],
};

module.exports = modelValidationRules;
