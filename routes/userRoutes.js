const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authmiddleware");

const { haveAllAccess } = require("../middlewares/gatesMiddleware");

const userValidationRules = require("../validations/userValidation");

const {
  getUserdetailsController,
  getAllUserdetailsController,
  updateUserController,
  getAllRolesController,
  changeUserStatusController,
  editUserController,
  getUserByIdController,
  createUserController,
  getDepartmentsListController,
  getDepartmentByRoleController,
  deleteUserController,
  assignStudentsController,
} = require("../controllers/userController");

const validate = require("../middlewares/validatorMiddleware");
const userValidation = require("../validations/userValidation");

router.get("/", authMiddleware, getUserdetailsController);

router.get(
  "/get-all-users",
  authMiddleware,
  haveAllAccess,
  getAllUserdetailsController
);

router.get(
  "/get-user/:userId",
  authMiddleware,
  userValidation.getUserById,
  validate,
  getUserByIdController
);

router.patch("/update", authMiddleware, updateUserController);

router.get("/roles", getAllRolesController);

router.patch(
  "/change-user-status",
  authMiddleware,
  userValidation.changeUserStatus,
  validate,
  changeUserStatusController
);

router.patch(
  "/edit-user",
  authMiddleware,
  userValidation.updateUser,
  validate,
  editUserController
);

router.get("/get-departments", getDepartmentsListController);

router.post(
  "/create-user",
  authMiddleware,
  haveAllAccess,
  createUserController
);

router.get(
  "/get-department-by-role/:roleId",
  authMiddleware,
  haveAllAccess,
  userValidation.getDepartmentByRole,
  validate,
  getDepartmentByRoleController
);

router.delete(
  "/delete-user",
  authMiddleware,
  haveAllAccess,
  userValidationRules.deleteUser,
  validate,
  deleteUserController
);

router.post(
  "/assign-students",
  authMiddleware,
  haveAllAccess,
  userValidation.assignStudents,
  validate,
  assignStudentsController
);
module.exports = router;
