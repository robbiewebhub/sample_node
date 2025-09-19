const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authmiddleware");
const { isSuperAdminOrAdmin } = require("../middlewares/gatesMiddleware");
const upload = require("../middlewares/multerMiddleware");

const validate = require("../middlewares/validatorMiddleware");
const modelValidationRules = require("../validations/modelValidation");

const {
  getAllModelsListController,
  deleteModelController,
  uploadModelController,
  setDefaultModelController,
  getArchivedModelsController,
  restoreDeletedModelController,
} = require("../controllers/modelController");

router.get(
  "/get-list",
  authMiddleware,
  isSuperAdminOrAdmin,
  getAllModelsListController
);

router.delete(
  "/delete",
  authMiddleware,
  isSuperAdminOrAdmin,
  modelValidationRules.deleteModel,
  validate,
  deleteModelController
);

router.post(
  "/upload",
  authMiddleware,
  isSuperAdminOrAdmin,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        logger.error(
          "An Error Occured While Uploading File : %s",
          err.message,
          { stack: err.stack }
        );
        return res
          .status(500)
          .json({ success: false, message: "Error during file upload." });
      }
      next();
    });
  },
  modelValidationRules.uploadModel,
  validate,
  uploadModelController
);

router.get(
  "/archived-models",
  authMiddleware,
  isSuperAdminOrAdmin,
  getArchivedModelsController
);

router.patch(
  "/set-default",
  authMiddleware,
  isSuperAdminOrAdmin,
  modelValidationRules.setDefaultModel,
  validate,
  setDefaultModelController
);

router.post(
  "/restore",
  authMiddleware,
  isSuperAdminOrAdmin,
  modelValidationRules.restoreModel,
  validate,
  restoreDeletedModelController
);

module.exports = router;
