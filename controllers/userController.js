require("dotenv").config();
const jwt = require("jsonwebtoken");
const {
  Role,
  User,
  University,
  Campus,
  Department,
  Student,
  sequelize,
} = require("../models");

const {
  USER_PREFIX,
  ROLES_MAPPING: { ADMIN, SUPER_ADMIN, CAMPUS_ADMIN, CAMPUS_MANAGER },
} = require("../config/constants");

const { logger } = require("../utils/loggerUtils");
const { hashPassword } = require("../utils/hashUtils");
const { sendUserCredentialsEmail } = require("../utils/emailUtils");

const { Op } = require("sequelize");
const { assignStudents } = require("../validations/userValidation");

const getUserdetailsController = async (req, res) => {
  try {
    const { loggedInUser } = req;

    if (!loggedInUser.id) {
      return res.status(400).json({
        success: false,
        message: "User ID is not available in provided token",
      });
    }

    const user = await User.findOne({
      where: { id: loggedInUser.id },
      include: [
        {
          model: Role,
          as: "role",
        },
      ],
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    let userCampus;

    if (
      (loggedInUser.role === ADMIN && loggedInUser?.campusId) ||
      (loggedInUser.role === SUPER_ADMIN && loggedInUser?.campusId)
    ) {
      userCampus = await Campus.findOne({
        where: { id: loggedInUser.campusId },
      });
    } else {
      userCampus = await user?.getCampus();
    }

    let userUniversity;
    if (loggedInUser.role === SUPER_ADMIN && loggedInUser?.universityId) {
      userUniversity = await University.findOne({
        where: { id: loggedInUser.universityId },
      });
    } else {
      userUniversity = await user?.getUniversity();
    }

    const data = {
      prefix: user.prefix,
      first_name: user.first_name,
      lastName: user.last_name,
      email: user.email,
      roleId: user.role_id,
      role: user.role.role_name,
      phone: user.phone,
    };

    if (
      loggedInUser.role !== SUPER_ADMIN &&
      !(loggedInUser.role === ADMIN && !loggedInUser?.campusId) &&
      !userCampus
    ) {
      // if user is not super admin, and not university admin and have not campus
      return res.status(400).json({
        success: false,
        message: "User does not have an assigned campus.",
      });
    }

    if (userCampus) {
      data.campus = {
        name: userCampus.campus_name,
        email: userCampus.campus_email,
        phone: userCampus.campus_phone,
        address: userCampus.campus_address,
        website: userCampus.campus_website,
        presidentPrefix: userCampus.president_prefix,
        presidentFirstName: userCampus.president_first_name,
        presidentLastName: userCampus.president_last_name,
      };
    }

    if (userUniversity) {
      data.university = {
        name: userUniversity.name,
        email: userUniversity.email,
        phone: userUniversity.phone,
        website: userUniversity.website,
        address: userUniversity.address,
        isActivated: userUniversity.is_activated,
      };
    }

    data.isCampus = userCampus ? true : false;

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data,
    });
  } catch (error) {
    logger.error(
      "An error occurred while fetching user details. : %s",
      error.message,
      { stack: error.stack }
    );
    res.status(500).json({
      success: false,
      message:
        "An error occurred while fetching user details.Please try again later.",
    });
  }
};

const getAllUserdetailsController = async (req, res) => {
  try {
    const { loggedInUser } = req;

    if (!loggedInUser.id) {
      return res.status(400).json({
        success: false,
        message: "User ID is not available in provided token",
      });
    }

    const existedUser = await User.findOne({ where: { id: loggedInUser.id } });

    if (!existedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User doesn't exist." });
    }

    const campusOrUniversityCondition = {};

    if (loggedInUser?.campusId) {
      campusOrUniversityCondition.campus_id = loggedInUser.campusId;
    } else {
      campusOrUniversityCondition.university_id = loggedInUser.universityId;
    }

    const users = await User.findAll({
      where: {
        ...campusOrUniversityCondition,
        id: {
          [Op.ne]: loggedInUser.id,
        },
      },
    });

    if (!users) {
      return res
        .status(404)
        .json({ success: false, message: "Users not found." });
    }

    const adminCount = await User.count({
      where: { ...campusOrUniversityCondition, role_id: CAMPUS_ADMIN },
    });

    const managerCount = await User.count({
      where: { ...campusOrUniversityCondition, role_id: CAMPUS_MANAGER },
    });

    const data = await Promise.all(
      users.map(async (user) => {
        const userDepartment = await user?.getDepartment();
        const assignedStudentsCount = await Student.count({
          where: { assigned_to: user.id },
        });

        return {
          id: user.id,
          prefix: user.prefix,
          first_name: user.first_name,
          last_name: user.last_name,
          name: `${USER_PREFIX[user.prefix]}. ${user.first_name} ${
            user.last_name
          }`.trim(),
          email: user.email,
          role: user.role_id,
          phone: user.phone,
          campus_id: user.campus_id,
          isActivate: user.is_activate,
          department: userDepartment?.department_name,
          assignedStudentsCount:
            user.role_id === CAMPUS_MANAGER ? assignedStudentsCount : undefined,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data,
      count: {
        total: adminCount + managerCount,
        admins: adminCount,
        managers: managerCount,
      },
    });
  } catch (error) {
    logger.error(`An error occured while fetching users : %s`, error.message, {
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "An error occured while fetching users. Please try again later.",
    });
  }
};

const updateUserController = async (req, res) => {
  const { prefix, first_name, last_name, role, email } = req.body;

  try {
    const token = req.headers["token"];
    const loggedInUser = jwt.decode(token);

    const existingUser = await User.findOne({ where: { id: loggedInUser.id } });
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User doesn't exist" });
    }

    if (email || email === "") {
      return res
        .status(400)
        .json({ success: false, message: "You can't change email address" });
    }

    if (prefix && !Object.keys(USER_PREFIX).includes(prefix)) {
      return res.status(400).json({
        success: false,
        message: "Please enter valid prefix",
      });
    }

    const updateObj = {};

    if (prefix) updateObj.prefix = prefix;
    if (first_name) updateObj.first_name = first_name;
    if (last_name) updateObj.last_name = last_name;

    if (!Object.keys(updateObj).length) {
      return res.status(200).json({
        success: false,
        message: "User details are same.",
      });
    }

    await User.update(updateObj, {
      where: {
        id: loggedInUser.id,
      },
    });

    // Retrieve the updated user from the database
    const updatedUser = await User.findOne({
      where: { id: loggedInUser.id },
    });

    const userRole = await updatedUser.getRole();

    res.status(200).json({
      success: true,
      message: "User updated successfully.",
      data: {
        id: updatedUser.id,
        prefix: updatedUser.prefix,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: userRole.role_name,
      },
    });
  } catch (error) {
    logger.error("Error While Updating user : %s", error.message, {
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: "Error updating user." });
  }
};

const getAllRolesController = async (req, res) => {
  try {
    const roles = await Role.findAll();

    if (roles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No roles found.",
      });
    }

    const data = roles.map((role) => ({
      id: role.id,
      role_name: role.role_name,
    }));

    res
      .status(200)
      .json({ success: true, message: "Roles fetched successfully.", data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "An error occurred while fetching roles. Please try again later.",
    });
  }
};

const changeUserStatusController = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { userId, isActivate, reAssignStudents, reAssignTo } = req.body;
    const { id } = req.loggedInUser;

    const userToUpdate = await User.findOne({
      where: { id: userId },
      transaction,
    });

    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please verify the user ID.",
      });
    }

    if (id === userToUpdate.id) {
      return res.status(422).json({
        success: false,
        message: "You cannot deactivate your own account.",
      });
    }

    if (isActivate === userToUpdate.is_activate) {
      return res.status(400).json({
        success: false,
        message: `User account is already ${
          isActivate ? "activated" : "deactivated"
        }`,
      });
    }

    if (!isActivate && reAssignStudents) {
      const reAssignUserExist = await User.findOne({
        where: { id: reAssignTo },
        transaction,
      });

      if (!reAssignUserExist) {
        return res.status(404).json({
          success: false,
          message:
            "The user to whom the students were reassigned does not exist.",
        });
      }

      await Student.update(
        { assigned_to: reAssignTo },
        { where: { assigned_to: userId }, transaction }
      );
    }

    await User.update(
      { is_activate: isActivate },
      { where: { id: userId }, transaction }
    );

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: `User has been ${
        isActivate ? "activated" : "deactivated"
      } successfully.`,
    });
  } catch (error) {
    await transaction.rollback();

    logger.error(
      "An error occurred while changing user status: %s",
      error.message,
      {
        stack: error.stack,
      }
    );

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while changing user status. Please try again later.",
    });
  }
};

const editUserController = async (req, res) => {
  try {
    const { userId, prefix, firstName, lastName, roleId, phone, departmentId } =
      req.body;
    const { loggedInUser } = req;

    if (loggedInUser.id === userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to edit your own details.",
      });
    }

    const userToUpdate = await User.findOne({ where: { id: userId } });

    if (!userToUpdate) {
      return res
        .status(404)
        .json({ success: false, message: "User doesn't exist" });
    }

    const updateObj = {
      prefix: prefix || userToUpdate.prefix,
      first_name: firstName || userToUpdate.first_name,
      last_name: lastName || userToUpdate.last_name,
      phone: phone || userToUpdate.phone,
      role_id: roleId || userToUpdate.role_id,
      department_id: departmentId || userToUpdate.department_id,
    };

    await User.update(updateObj, { where: { id: userId } });

    res.status(200).json({
      success: true,
      message: "User updated successfully.",
    });
  } catch (error) {
    logger.error(
      "An error occurred while updating the user: %s",
      error.message,
      {
        stack: error.stack,
      }
    );

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while updating the user. Please try again later.",
    });
  }
};

const getUserByIdController = async (req, res) => {
  try {
    const { userId } = req.params;
    const { loggedInUser } = req;

    if (loggedInUser.role !== ADMIN) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to get user details.",
      });
    }

    if (loggedInUser.id === userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to get your own details.",
      });
    }

    const existedUser = await User.findOne({
      where: { id: userId },
      include: [
        {
          model: Role,
          as: "role",
        },
      ],
    });

    if (!existedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User doesn't exist" });
    }

    const userDepartment = await existedUser.getDepartment();

    res.status(200).json({
      success: true,
      message: "User fetched successfully.",
      data: {
        prefix: existedUser.prefix,
        firstName: existedUser.first_name,
        lastName: existedUser.last_name,
        email: existedUser.email,
        phone: existedUser.phone,
        roleId: existedUser.role_id,
        role: existedUser.role.role_name,
        departmentId: userDepartment?.id,
        department: userDepartment?.department_name,
      },
    });
  } catch (error) {
    logger.error("An error occurred while fetching user: %s", error.message, {
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while fetching the user. Please try again later.",
    });
  }
};

const createUserController = async (req, res) => {
  try {
    const {
      prefix,
      firstName,
      lastName,
      email,
      phone,
      roleId,
      departmentId,
      password,
      assignedStudents,
      sendCredentials,
    } = req.body;

    const { loggedInUser } = req;

    const existedUser = await User.findOne({
      where: { [Op.or]: [{ email }, { phone }] },
    });

    if (existedUser) {
      return res.status(409).json({
        success: false,
        message: `user with same ${
          email === existedUser.email ? "email" : "phone"
        } exist`,
      });
    }

    const roleExist = await Role.findOne({ where: { id: roleId } });

    if (!roleExist) {
      return res.status(404).json({
        success: false,
        message: "Role does not exist.",
      });
    }

    const departmentExist = await Department.findOne({
      where: { id: departmentId, role_id: roleId },
    });

    if (!departmentExist) {
      return res.status(404).json({
        success: false,
        message: "Department does not exist for this role.",
      });
    }

    const hashedPassword = await hashPassword(password ?? "welcome@123");

    const insertObj = {
      prefix,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      role_id: roleId,
      department_id: departmentId,
      password: hashedPassword,
      campus_id: loggedInUser.campusId,
    };

    await User.create(insertObj);

    if (sendCredentials) {
      const passwordCred = password ?? "welcome@123";
      sendUserCredentialsEmail({
        email,
        password: passwordCred,
        department: departmentExist.department_name,
        role: roleExist.role_name,
      });
    }

    return res
      .status(201)
      .json({ success: true, message: "User created successfully." });
  } catch (error) {
    logger.error("An error occurred while creating user: %s", error.message, {
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while creating user. Please try again later.",
    });
  }
};

const getDepartmentsListController = async (req, res) => {
  try {
    const departments = await Department.findAll({
      attributes: ["id", "department_name", "role_id"],
    });

    const data = departments.map((department) => ({
      id: department.id,
      departmentName: department.department_name,
      roleId: department.role_id,
    }));

    return res.status(200).json({
      success: true,
      message: "Departments Fetched Successfully",
      data: departments,
    });
  } catch (error) {
    logger.error(
      "An error occurred while fetching departments: %s",
      error.message,
      {
        stack: error.stack,
      }
    );

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while fetching departments. Please try again later.",
    });
  }
};

const getDepartmentByRoleController = async (req, res) => {
  try {
    const { roleId } = req.params;

    const existedRole = await Role.findOne({ where: { id: roleId } });

    if (!existedRole) {
      return res.status(404).json({
        success: false,
        message: "Role does not exist.",
      });
    }

    const department = await Department.findAll({ where: { role_id: roleId } });

    const data = department.map((department) => ({
      id: department.id,
      departmentName: department.department_name,
    }));

    return res.status(200).json({
      success: true,
      message: "Departments fetched successfully.",
      data,
    });
  } catch (error) {
    logger.error(
      "An error occurred while fetching department: %s",
      error.message,
      {
        stack: error.stack,
      }
    );

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while fetching department. Please try again later.",
    });
  }
};

const deleteUserController = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { userId, reAssignStudents, reAssignTo } = req.body;
    const { loggedInUser } = req;

    const userToDelete = await User.findOne({
      where: { id: userId, campus_id: loggedInUser.campusId },
      transaction,
    });

    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: "User does not exist.",
      });
    }

    if (reAssignStudents) {
      const reAssignUserExist = await User.findOne({
        where: { id: reAssignTo },
        transaction,
      });

      if (!reAssignUserExist) {
        return res.status(404).json({
          success: false,
          message:
            "The user to whom the students were reassigned does not exist.",
        });
      }

      await Student.update(
        { assigned_to: reAssignTo },
        { where: { assigned_to: userId }, transaction }
      );
    }

    if (!reAssignStudents) {
      await Student.update(
        { assigned_to: null },
        { where: { assigned_to: userId }, transaction }
      );
    }

    await User.destroy({
      where: { id: userId, campus_id: loggedInUser.campusId },
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    await transaction.rollback();
    logger.error("An error occurred while deleting user: %s", error.message, {
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while deleting user. Please try again later.",
    });
  }
};

const assignStudentsController = async (req, res) => {
  try {
    const { managerId, students } = req.body;

    const managerExist = await User.findOne({ where: { id: managerId } });

    if (!managerExist) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exist." });
    }

    if (managerExist.role_id !== CAMPUS_MANAGER) {
      return res.status(400).json({
        success: false,
        message: "Students only assigned to managers.",
      });
    }

    const studentAlreadyAssigned = await Student.findAll({
      where: {
        id: {
          [Op.in]: students,
        },
        assigned_to: {
          [Op.ne]: null,
        },
      },
    });

    if (studentAlreadyAssigned?.length) {
      const studentsNames = studentAlreadyAssigned
        .map((student) => student.name)
        .join(" , ");
      return res.status(409).json({
        success: false,
        message: `Student (${studentsNames}) already assigned.`,
      });
    }

    await Student.update(
      { assigned_to: managerId },
      {
        where: {
          id: {
            [Op.in]: students,
          },
        },
      }
    );

    return res
      .status(200)
      .json({ success: true, message: "Students Assigned Successfully." });
  } catch (error) {
    logger.error(
      "An error occurred while assigning students: %s",
      error.message,
      {
        stack: error.stack,
      }
    );

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while assigning students. Please try again later.",
    });
  }
};

module.exports = {
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
};
