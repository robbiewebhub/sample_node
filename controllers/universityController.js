const { Op } = require("sequelize");
const { sequelize, University, User } = require("../models");
const { logger } = require("../utils/loggerUtils");
const { hashPassword } = require("../utils/hashUtils");
const {
  ROLES_MAPPING: { SUPER_ADMIN, ADMIN, DIRECTOR, MANAGER },
} = require("../config/constants");

const getUniversitiesController = async (req, res) => {
  try {
    const universities = await University.findAll();

    const data = universities.map((university) => ({
      id: university.id,
      name: university.name,
      email: university.email,
      phone: university.phone,
      address: university.address,
      website: university.website,
      isActivated: university.is_activated,
    }));

    return res.status(200).json({
      success: true,
      message: "Universities fetched successfully.",
      data,
    });
  } catch (error) {
    logger.error(
      "An error occured while fetching universities : %s",
      error.message,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while fetching universities. Please try again later.",
    });
  }
};

const createUniversityController = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      name,
      email,
      phone,
      website,
      address,
      user: {
        prefix,
        firstName,
        lastName,
        email: userEmail,
        phone: userPhone,
        password,
      },
    } = req.body;

    const universityAlreadyExist = await University.findOne({
      where: { [Op.or]: [{ email }, { phone }] },
      transaction,
    });

    if (universityAlreadyExist) {
      return res.status(409).json({
        success: false,
        message: `University with same ${
          email === universityAlreadyExist.email ? "email" : "phone"
        } already exists.`,
      });
    }

    const userExist = await User.findOne({
      where: { [Op.or]: [{ email: userEmail }, { phone: userPhone }] },
      transaction,
    });

    if (userExist) {
      return res.status(409).json({
        success: false,
        message: `User with same ${
          email === userExist.email ? "email" : "phone"
        } already exists.`,
      });
    }

    const hashedPassword = await hashPassword(password);

    await University.create(
      {
        name,
        email,
        phone,
        website,
        address,
        users: [
          {
            prefix,
            first_name: firstName,
            last_name: lastName,
            email: userEmail,
            phone: userPhone,
            password: hashedPassword,
            role_id: ADMIN,
          },
        ],
      },
      {
        include: [
          {
            model: User,
            as: "users",
          },
        ],
        transaction,
      }
    );

    await transaction.commit();

    return res
      .status(201)
      .json({ success: true, message: "University created successfully." });
  } catch (error) {
    await transaction.rollback();

    logger.error(
      "An error occurred while creating university: %s",
      error.message,
      {
        stack: error.stack,
      }
    );

    return res.status(500).json({
      success: false,
      message:
        "An error occurred while creating university. Please try again later.",
    });
  }
};

const updateUniversityController = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id, name, email, phone, website, address, user } = req.body;

    const universityAlreadyExist = await University.findOne({
      where: { id },
      transaction,
    });

    if (!universityAlreadyExist) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ success: false, message: "University does not exist." });
    }

    if (email) {
      const universityWithSameEmail = await University.findOne({
        where: { email },
        transaction,
      });

      if (universityWithSameEmail && universityWithSameEmail.id !== id) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: `University with same email exists.`,
        });
      }
    }

    if (phone) {
      const universityWithSamePhone = await University.findOne({
        where: { phone },
        transaction,
      });

      if (universityWithSamePhone && universityWithSamePhone.id !== id) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: `University with same phone exists.`,
        });
      }
    }

    if (user) {
      const userAlreadyExist = await User.findOne({
        where: { university_id: universityAlreadyExist.id, role_id: ADMIN },
        transaction,
      });

      if (!userAlreadyExist) {
        await transaction.rollback();
        return res
          .status(404)
          .json({ success: false, message: "User does not exist." });
      }

      if (email) {
        const userWithSameEmail = await User.findOne({
          where: { email },
          transaction,
        });

        if (userWithSameEmail && userWithSameEmail.id !== id) {
          await transaction.rollback();
          return res.status(409).json({
            success: false,
            message: `User with same email exists.`,
          });
        }
      }

      if (phone) {
        const userWithSamePhone = await User.findOne({
          where: { phone },
          transaction,
        });

        if (userWithSamePhone && userWithSamePhone.id !== id) {
          await transaction.rollback();
          return res.status(409).json({
            success: false,
            message: `User with same phone exists.`,
          });
        }
      }
    }

    const updateObj = {};

    if (name) updateObj.name = name;
    if (email) updateObj.email = email;
    if (phone) updateObj.phone = phone;
    if (website) updateObj.website = website;
    if (address) updateObj.address = address;

    const userUpdateObj = {};

    if (user?.prefix) userUpdateObj.prefix = user?.prefix;
    if (user?.firstName) userUpdateObj.first_name = user?.firstName;
    if (user?.lastName) userUpdateObj.last_name = user?.lastName;
    if (user?.phone) userUpdateObj.phone = user?.phone;

    await University.update(updateObj, {
      where: { id },
      transaction,
    });

    if (user) {
      await User.update(userUpdateObj, {
        where: { university_id: universityAlreadyExist.id, role_id: ADMIN },
        transaction,
      });
    }

    await transaction.commit();

    return res
      .status(200)
      .json({ success: true, message: "University updated successfully." });
  } catch (error) {
    await transaction.rollback();

    logger.error(
      "An error occurred while updating university: %s",
      error.message,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while updating university. Please try again later.",
    });
  }
};

const changeUniversityStatusController = async (req, res) => {
  try {
    const { id, isActivated } = req.body;

    const universityAlreadyExist = await University.findOne({
      where: { id },
    });

    if (!universityAlreadyExist) {
      return res
        .status(404)
        .json({ success: false, message: "University does not exist." });
    }

    if (universityAlreadyExist.is_activated === isActivated) {
      return res.status(409).json({
        success: false,
        message: `University status already set to ${
          isActivated ? "activated" : "deactivated"
        }.`,
      });
    }
    await University.update({ is_activated: isActivated }, { where: { id } });

    return res.status(200).json({
      success: true,
      message: `University ${
        isActivated ? "activated" : "deactivated"
      } successfully.`,
    });
  } catch (error) {
    logger.error(
      "An error occured while changing university status : %s",
      error.message,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while changing university status. Please try again later.",
    });
  }
};

const getUniversityByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const university = await University.findOne({
      where: { id },
      include: [
        {
          model: User,
          as: "users",
        },
      ],
    });

    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found.",
      });
    }

    const data = {
      id: university.id,
      name: university.name,
      email: university.email,
      phone: university.phone,
      address: university.address,
      website: university.website,
      isActivated: university.is_activated,
      user: {
        prefix: university.users[0].prefix,
        firstName: university.users[0].first_name,
        lastName: university.users[0].last_name,
        email: university.users[0].email,
        phone: university.users[0].phone,
      },
    };

    return res.status(200).json({
      success: true,
      message: "University fetched successfully.",
      data,
    });
  } catch (error) {
    logger.error(
      "An error occured while fetching university : %s",
      error.message,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while fetching university. Please try again later.",
    });
  }
};

module.exports = {
  getUniversitiesController,
  createUniversityController,
  updateUniversityController,
  changeUniversityStatusController,
  getUniversityByIdController,
};
