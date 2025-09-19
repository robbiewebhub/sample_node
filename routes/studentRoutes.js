const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authmiddleware");
const {
  haveAllAccess,
  notForManager,
  notSuperAdmin,
} = require("../middlewares/gatesMiddleware");

const studentValidationRules = require("../validations/studentValidation");
const validate = require("../middlewares/validatorMiddleware");

const {
  getAllStudentsController,
  getStudentByIdController,
  getDemographicsController,
  getAttendanceController,
  getRiskedStudentsController,
  getDraftMessagesController,
  saveDraftMessageController,
  sendRiskMailController,
  addStudentUnderCareListController,
  undoCarelistedStudentController,
  showCarelistController,
  countryDemographicsController,
} = require("../controllers/studentController");

const upload = require("../middlewares/multerMiddleware");

router.get(
  "/demographics",
  authMiddleware,
  notForManager,
  studentValidationRules.getDemographics,
  validate,
  getDemographicsController
);

router.get(
  "/attendance",
  authMiddleware,
  haveAllAccess,
  getAttendanceController
);

router.get(
  "/",
  authMiddleware,
  haveAllAccess,
  studentValidationRules.getAllStudents,
  validate,
  getAllStudentsController
);

router.get(
  "/risk-students",
  authMiddleware,
  notSuperAdmin,
  studentValidationRules.riskedStudents,
  validate,
  getRiskedStudentsController
);

router.get(
  "/drafts",
  authMiddleware,
  notSuperAdmin,
  studentValidationRules.draftMessages,
  validate,
  getDraftMessagesController
);

router.patch(
  "/save-draft",
  authMiddleware,
  notSuperAdmin,
  studentValidationRules.saveDraft,
  validate,
  saveDraftMessageController
);

router.post(
  "/send-risk-mail",
  authMiddleware,
  notSuperAdmin,
  upload.array("attachments", 10),
  studentValidationRules.sendRiskMail,
  validate,
  sendRiskMailController
);

router.get(
  "/show-carelist",
  authMiddleware,
  notSuperAdmin,
  studentValidationRules.showCarelistStudents,
  validate,
  showCarelistController
);

router.post(
  "/add-carelist",
  authMiddleware,
  notSuperAdmin,
  studentValidationRules.addStudentsToCarelist,
  validate,
  addStudentUnderCareListController
);

router.post(
  "/undo-carelist",
  authMiddleware,
  notSuperAdmin,
  studentValidationRules.undoStudentsFromCarelist,
  validate,
  undoCarelistedStudentController
);

router.get(
  "/country-demographics",
  authMiddleware,
  notSuperAdmin,
  countryDemographicsController
);

router.get("/:id", authMiddleware, haveAllAccess, getStudentByIdController);

module.exports = router;
