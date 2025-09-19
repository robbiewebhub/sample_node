const express = require("express");
const router = express.Router();

const {
  createVisitingUserController,
} = require("../controllers/visitingUserController");

const validate = require("../middlewares/validatorMiddleware");
const visitingUserValidationRules = require("../validations/visitingUserValidation");

router.post(
  "/user",
  visitingUserValidationRules.createUser,
  validate,
  createVisitingUserController
);

module.exports = router;
