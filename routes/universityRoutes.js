const express = require("express");
const router = express.Router();

const authmiddleware = require("../middlewares/authmiddleware");
const { isSuperAdmin } = require("../middlewares/gatesMiddleware");
const validate = require("../middlewares/validatorMiddleware");
const universityValidationRules = require("../validations/universityValidation");

const {
  getUniversitiesController,
  createUniversityController,
  updateUniversityController,
  changeUniversityStatusController,
  getUniversityByIdController,
} = require("../controllers/universityController");

router.get("/", authmiddleware, isSuperAdmin, getUniversitiesController);

router.post(
  "/create",
  authmiddleware,
  isSuperAdmin,
  universityValidationRules.createUniversity,
  validate,
  createUniversityController
);

router.patch(
  "/update",
  authmiddleware,
  isSuperAdmin,
  universityValidationRules.updateUniversity,
  validate,
  updateUniversityController
);

router.patch(
  "/update-status",
  authmiddleware,
  isSuperAdmin,
  universityValidationRules.changeStatusUniversity,
  validate,
  changeUniversityStatusController
);

router.get("/:id", authmiddleware, isSuperAdmin, getUniversityByIdController);

module.exports = router;
