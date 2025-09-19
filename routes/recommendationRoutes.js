const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authmiddleware");
// const authValidationRules = require("../validations/authValidation");
// const validate = require("../middlewares/validatorMiddleware");

const { notSuperAdmin } = require("../middlewares/gatesMiddleware");

const {
  getAllRecommendationsController,
  getAssignedRecommendationsController,
} = require("../controllers/recommendationController");

router.get("/", authMiddleware, notSuperAdmin, getAllRecommendationsController);

router.get(
  "/assigned-recommendations",
  authMiddleware,
  notSuperAdmin,
  getAssignedRecommendationsController
);

module.exports = router;
