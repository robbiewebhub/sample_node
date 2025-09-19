const { Campus, User, Role, sequelize, University } = require("../models");
const { hashPassword } = require("../utils/hashUtils");
const jwt = require("jsonwebtoken");
const { logger } = require("../utils/loggerUtils");
const {
  ROLES_MAPPING: { SUPER_ADMIN, ADMIN, DIRECTOR, MANAGER },
} = require("../config/constants");
const { Op } = require("sequelize");

const createCampusController = async (req, res) => {
  const {
    name,
    email,
    phone,
    address,
    website,
    president_prefix,
    president_first_name,
    president_last_name,
    universityId,
  } = req.body;

  const transaction = await sequelize.transaction();

  try {
    const existedUniversity = await University.findOne({
      where: { id: universityId },
      transaction,
    });

    if (!existedUniversity) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ success: false, message: "University does not exist." });
    }

    const existedCampus = await Campus.findOne({
      where: { campus_email: email },
      transaction,
    });

    if (existedCampus) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: "Campus already exists.",
      });
    }

    const existedCampusWithPhone = await Campus.findOne({
      where: { campus_phone: phone },
      transaction,
    });

    if (existedCampusWithPhone) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: "Campus with phone number already exist.",
      });
    }

    const countDefaultCampus = await Campus.count({
      where: { is_default: true, university_id: universityId },
      transaction,
    });

    const newCampus = await Campus.create({
      campus_name: name,
      campus_email: email,
      campus_phone: phone,
      campus_address: address,
      campus_website: website,
      president_prefix,
      president_first_name,
      president_last_name,
      university_id: universityId,
      is_default: countDefaultCampus === 0 ? true : false,
    });

    const data = {
      id: newCampus.id,
      name: newCampus.campus_name,
      email: newCampus.campus_email,
      phone: newCampus.campus_phone,
      address: newCampus.campus_address,
      website: newCampus.campus_website,
      president_prefix: newCampus.president_prefix,
      president_first_name: newCampus.president_first_name,
      president_last_name: newCampus.president_last_name,
      isDefault: newCampus.is_default,
    };

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: "Campus and user created successfully.",
      data,
    });
  } catch (error) {
    await transaction.rollback();

    logger.error("An error occurred while creating campus: %s", error.message, {
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message:
        "An error occurred while creating campus and user. Please try again later.",
    });
  }
};

const getAllCampusesController = async (req, res) => {
  try {
    const campuses = await Campus.findAll();

    const data = await Promise.all(
      campuses.map(async (campus) => {
        const university = await campus?.getUniversity();

        return {
          id: campus.id,
          name: campus.campus_name,
          email: campus.campus_email,
          phone: campus.campus_phone,
          address: campus.campus_address,
          website: campus.campus_website,
          presidentPrefix: campus.president_prefix,
          presidentFirstName: campus.president_first_name,
          presidentLastName: campus.president_last_name,
          isActivate: campus.is_activate,
          isDefault: campus.is_default,
          universityId: campus.university_id,
          university: university?.name,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Campuses retrieved successfully.",
      data,
    });
  } catch (error) {
    logger.error(
      "An error occured while fetching campuses : %s",
      error.message,
      { stack: error.stack }
    );
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while fetching campuses. Please try again later.",
    });
  }
};

const updateCampusStatusController = async (req, res) => {
  try {
    const { campusId, isActivate } = req.body;

    const campusToUpdate = await Campus.findOne({ where: { id: campusId } });

    if (!campusToUpdate) {
      return res.status(404).json({
        success: false,
        message: "Campus does not exist.",
      });
    }

    if (campusToUpdate.is_activate === isActivate) {
      return res.status(400).json({
        success: false,
        message: `Campus status already ${
          isActivate ? "activated" : "deactivated"
        }`,
      });
    }

    await Campus.update(
      { is_activate: isActivate },
      { where: { id: campusId } }
    );

    return res.status(200).json({
      success: true,
      message: `Campus ${
        isActivate ? "activated" : "deactivated"
      } successfully.`,
    });
  } catch (error) {
    logger.error(
      "An error occured while updating campus status : %s",
      error.message,
      { stack: error.stack }
    );
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while updating campus status. Please try again later.",
    });
  }
};

const updateCampusController = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      universityId,
      campusId,
      name,
      phone,
      address,
      website,
      presidentPrefix,
      presidentFirstName,
      presidentLastName,
      user,
    } = req.body;

    const { loggedInUser } = req;

    const campusToUpdate = await Campus.findOne({
      where: { id: campusId },
      transaction: t,
    });

    if (!campusToUpdate) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Campus does not exist.",
      });
    }

    if (phone) {
      const existedCampusWithPhone = await Campus.findOne({
        where: { campus_phone: phone, id: { [Op.ne]: campusId } },
        transaction: t,
      });

      if (existedCampusWithPhone) {
        await t.rollback();
        return res.status(409).json({
          success: false,
          message: "Campus with phone number already exist.",
        });
      }
    }

    if (user) {
      const userToUpdate = await User.findOne({
        where: { campus_id: campusId, role_id: ADMIN },
        transaction: t,
      });

      if (!userToUpdate) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: "User does not exist.",
        });
      }

      if (user.phone) {
        const existedUserWithPhone = await User.findOne({
          where: { phone: user.phone, id: { [Op.ne]: userToUpdate.id } },
          transaction: t,
        });

        if (existedUserWithPhone) {
          await t.rollback();
          return res.status(409).json({
            success: false,
            message: "User with phone number already exist.",
          });
        }
      }
    }

    const campusUpdateObj = {};

    if (universityId) campusUpdateObj.university_id = universityId;
    if (name) campusUpdateObj.campus_name = name;
    if (phone) campusUpdateObj.campus_phone = phone;
    if (website) campusUpdateObj.campus_website = website;
    if (address) campusUpdateObj.campus_address = address;
    if (presidentPrefix) campusUpdateObj.president_prefix = presidentPrefix;
    if (presidentFirstName)
      campusUpdateObj.president_first_name = presidentFirstName;
    if (presidentLastName)
      campusUpdateObj.president_last_name = presidentLastName;

    const userUpdateObj = {};

    if (user?.prefix) userUpdateObj.prefix = user?.prefix;
    if (user?.firstName) userUpdateObj.first_name = user?.firstName;
    if (user?.lastName) userUpdateObj.last_name = user?.lastName;
    if (user?.phone) userUpdateObj.phone = user?.phone;

    await Campus.update(campusUpdateObj, {
      where: { id: campusId },
      transaction: t,
    });

    if (user) {
      await User.update(userUpdateObj, {
        where: { campus_id: campusId, role_id: ADMIN },
        transaction: t,
      });
    }

    await t.commit();

    return res.status(200).json({
      success: true,
      message: `Campus and user updated successfully.`,
    });
  } catch (error) {
    await t.rollback();

    logger.error("An error occurred while updating campus: %s", error.message, {
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message:
        "An error occurred while updating campus. Please try again later.",
    });
  }
};

const getCampusByIdController = async (req, res) => {
  try {
    const { campusId } = req.params;

    const existedCampus = await Campus.findOne({
      where: { id: campusId },
    });

    if (!existedCampus) {
      return res
        .status(404)
        .json({ success: false, message: "Campus doesn't exist." });
    }

    const university = await existedCampus?.getUniversity();

    const data = {
      ...existedCampus.get(),
      university: university.name,
    };

    res.status(200).json({
      success: true,
      message: "Campus fetched successfully.",
      data,
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

const getStaffCountController = async (req, res) => {
  const { loggedInUser } = req;

  try {
    if (loggedInUser.role == ADMIN) {
      const existedUser = await User.findOne({
        where: { id: loggedInUser.id },
      });

      const totalCampusUsers = await User.count({
        where: { campus_id: existedUser.campus_id },
      });

      const totalAdmin = await User.count({
        where: { campus_id: existedUser.campus_id, role_id: ADMIN },
      });

      const totalDirector = await User.count({
        where: { campus_id: existedUser.campus_id, role_id: DIRECTOR },
      });

      const totalManager = await User.count({
        where: { campus_id: existedUser.campus_id, role_id: MANAGER },
      });

      res.status(200).json({
        success: true,
        message: "This is admin authenticated",
        data: {
          totalUsers: totalCampusUsers,
          totalAdmins: totalAdmin,
          totalDirectors: totalDirector,
          totalManagers: totalManager,
        },
      });
    } else {
      res
        .status(200)
        .json({ success: false, message: "Your are not authotrized." });
    }
  } catch (err) {
    console.log(`error : ${err}`);
  }
};

const updateDefaultCampusController = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { campusId } = req.body;

    const existedCampus = await Campus.findOne({
      where: { id: campusId },
      transaction,
    });

    if (!existedCampus) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Campus does not exist." });
    }

    if (existedCampus.is_default) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: "Campus is already set to default campus.",
      });
    }

    await Campus.update(
      { is_default: false },
      {
        where: { is_default: true, university_id: existedCampus.university_id },
        transaction,
      }
    );

    await Campus.update(
      { is_default: true },
      {
        where: { id: campusId },
        transaction,
      }
    );

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Campus is set to default campus successfully.",
    });
  } catch (error) {
    await transaction.rollback();
    logger.error(
      "An error occurred while updating default campus: %s",
      error.message,
      {
        stack: error.stack,
      }
    );

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while updating default campus. Please try again later.",
    });
  }
};

const getLoggedInUserCampusesController = async (req, res) => {
  try {
    const { loggedInUser } = req;

    const campuses = await Campus.findAll({
      where: { university_id: loggedInUser.universityId, is_activate: true },
    });

    const data = campuses.map((campus) => ({
      id: campus.id,
      name: campus.campus_name,
      address: campus.campus_address
    }));

    return res
      .status(200)
      .json({ success: true, message: "Campuses fetched successfully.", data });
  } catch (error) {
    logger.error(
      "An error occurred while fetching universities campuses: %s",
      error.message,
      {
        stack: error.stack,
      }
    );

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while fetching universities campuses. Please try again later.",
    });
  }
};

const switchCampusController = async (req, res) => {
  try {
    const { campusId } = req.params;
    const { loggedInUser } = req;

    const campusExist = await Campus.findOne({
      where: { id: campusId, university_id: loggedInUser.universityId },
    });

    if (!campusExist) {
      return res
        .status(404)
        .json({ success: false, message: "Campus does not exist." });
    }

    const token = jwt.sign(
      {
        id: loggedInUser.id,
        role: loggedInUser.role,
        campusId: campusExist.id,
        universityId: loggedInUser.universityId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      success: true,
      message: "Campus Switched successfully.",
      token,
    });
  } catch (error) {
    logger.error(
      "An error occurred while fetching switching campus: %s",
      error.message,
      {
        stack: error.stack,
      }
    );

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while switching campus. Please try again later.",
    });
  }
};

module.exports = {
  createCampusController,
  getAllCampusesController,
  updateCampusStatusController,
  updateCampusController,
  getCampusByIdController,
  getStaffCountController,
  updateDefaultCampusController,
  getLoggedInUserCampusesController,
  switchCampusController,
};
