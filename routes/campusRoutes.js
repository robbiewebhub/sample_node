const express = require("express");
const router = express.Router();
const http = require("http");
const axios = require("axios");

const authMiddleware = require("../middlewares/authmiddleware");

const validate = require("../middlewares/validatorMiddleware");
const campusValidationRules = require("../validations/campusValidation");

const { isSuperAdmin, isAdmin } = require("../middlewares/gatesMiddleware");

const {
  createCampusController,
  getAllCampusesController,
  updateCampusStatusController,
  updateCampusController,
  getCampusByIdController,
  getStaffCountController,
  updateDefaultCampusController,
  getLoggedInUserCampusesController,
  switchCampusController,
} = require("../controllers/campusController");

router.get(
  "/get-all-campus",
  authMiddleware,
  isSuperAdmin,
  getAllCampusesController
);

router.post(
  "/create",
  authMiddleware,
  isSuperAdmin,
  campusValidationRules.createCampus,
  validate,
  createCampusController
);

router.patch(
  "/update-status",
  authMiddleware,
  isSuperAdmin,
  campusValidationRules.updateCampusStatus,
  validate,
  updateCampusStatusController
);

router.patch(
  "/update",
  authMiddleware,
  isSuperAdmin,
  campusValidationRules.update,
  validate,
  updateCampusController
);

router.get(
  "/get-campus/:campusId",
  authMiddleware,
  isSuperAdmin,
  getCampusByIdController
);

router.get("/get-staff-count", authMiddleware, getStaffCountController);

router.patch(
  "/update-default-campus",
  authMiddleware,
  isSuperAdmin,
  campusValidationRules.updateDefaultCampus,
  validate,
  updateDefaultCampusController
);

router.get(
  "/get-universities-campuses",
  authMiddleware,
  isAdmin,
  getLoggedInUserCampusesController
);

router.get(
  "/switch/:campusId",
  authMiddleware,
  isAdmin,
  switchCampusController
);

module.exports = router;
