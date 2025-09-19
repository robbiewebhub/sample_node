const { Campus, User, Role, sequelize, Model } = require("../models");
const { Op } = require("sequelize");
const { logger } = require("../utils/loggerUtils");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const {
  ROLES_MAPPING: { SUPER_ADMIN, ADMIN },
  MODEL_BASE_URL,
} = require("../config/constants");
const { deleteModel } = require("../validations/modelValidation");

const getAllModelsListController = async (req, res) => {
  try {
    const { loggedInUser } = req;

    const existedUser = await User.findOne({
      where: { id: loggedInUser.id },
    });

    if (!existedUser) {
      return res.status(404).json({
        success: false,
        message: "User does not exist",
      });
    }
    const campusId =
      loggedInUser.role === SUPER_ADMIN
        ? loggedInUser.campusId
        : existedUser.campus_id;

    const models = await Model.findAll({
      where: { campus_id: campusId, is_deleted: false },
    });

    const data = models.map((model) => ({
      modelName: model.model_name,
      isDeleted: model.is_deleted,
      isDefault: model.is_default,
    }));

    return res.status(200).json({
      success: true,
      message: "Models fetched successfully.",
      data: {
        models: data,
        defaultModel: models.filter((model) => model.is_default)[0]?.model_name,
      },
    });
  } catch (error) {
    logger.error(
      "An error occured while fetching models list : %s",
      error.message,
      { stack: error.stack }
    );
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while fetching models list. Please try again later.",
    });
  }
};

const deleteModelController = async (req, res) => {
  try {
    const { modelId } = req.body;
    const { loggedInUser } = req;

    const existedUser = await User.findOne({ where: { id: loggedInUser.id } });

    if (!existedUser) {
      return res.status(404).json({
        success: false,
        message: "User does not exist.",
      });
    }

    const campusId =
      loggedInUser.role === SUPER_ADMIN
        ? loggedInUser.campusId
        : existedUser.campus_id;

    const existedCampus = await Campus.findOne({
      where: { id: campusId },
    });

    if (!existedCampus) {
      return res.status(404).json({
        success: false,
        message: "Campus does not exist.",
      });
    }

    const modelToBeDeleted = await Model.findOne({
      where: {
        model_name: modelId,
        campus_id: campusId,
        is_deleted: false,
      },
    });

    if (!modelToBeDeleted) {
      return res.status(404).json({
        success: false,
        message: "Model does not exist.",
      });
    }

    if (modelToBeDeleted.is_default) {
      return res.status(403).json({
        success: false,
        message: "you can not delete the default model.",
      });
    }

    const today = new Date();
    const date =
      today.getFullYear() +
      "-" +
      (today.getMonth() + 1) +
      "-" +
      today.getDate();
    const time =
      today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    const dateTime = date + " " + time;

    await Model.update(
      {
        is_deleted: true,
        deleted_at: dateTime,
      },
      { where: { model_name: modelId, campus_id: campusId } }
    );

    return res.status(200).json({
      success: true,
      message: "Model deleted successfully.",
    });
  } catch (error) {
    logger.error("An error occured while deleting model : %s", error.message, {
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while deleting model. Please try again later.",
    });
  }
};

const uploadModelController = async (req, res) => {
  try {
    const { file, loggedInUser } = req;

    const filePath = file.path;

    const existedUser = await User.findOne({
      where: { id: loggedInUser.id },
    });

    if (!existedUser) {
      return res.status(404).json({
        success: false,
        message: "User does not exist.",
      });
    }

    if (loggedInUser?.campusId) {
      const existedCampus = await Campus.findOne({
        where: {
          id: loggedInUser.campusId,
        },
      });

      if (!existedCampus) {
        return res.status(404).json({
          success: dalse,
          message: "Campus does not exist.",
        });
      }
    }

    const campusId =
      loggedInUser.role === SUPER_ADMIN
        ? loggedInUser.campusId
        : existedUser.campus_id;

    const modelExist = await Model.findOne({
      where: { model_name: file.filename },
    });

    if (modelExist) {
      return res.status(404).json({
        success: false,
        message:
          "File name already exist for another campus, please rename your file and upload again.",
      });
    }

    const form = new FormData();

    form.append("file", fs.createReadStream(filePath), {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    form.append("delimiter", "");

    const apiUrl = `${MODEL_BASE_URL}/upload-csv/`;

    await axios.post(apiUrl, form);

    const existedDefaultModel = await Model.count({
      where: {
        campus_id: campusId,
        is_default: true,
      },
    });

    const data = {
      model_name: file.filename,
      created_by: loggedInUser.id,
      campus_id: campusId,
      is_default: existedDefaultModel === 0 ? true : false,
    };

    await Model.create(data);

    fs.unlinkSync(filePath);

    return res.status(200).json({
      success: true,
      message: "Model uploaded successfully.",
    });
  } catch (error) {
    if (error.response) {
      logger.error(
        "Response error: %s",
        error.response.status,
        error.response.data,
        error.response.statusText,
        { stack: error.stack }
      );

      return res.status(500).json({
        success: false,
        message:
          error?.response?.data?.detail ??
          "An error occurred while uploading model. Please try again later.",
      });
    } else if (error.request) {
      logger.error("Request error: %s", error.request, { stack: error.stack });
    } else {
      logger.error(
        "An error occured while uploading model : %s",
        error.message,
        { stack: error.stack }
      );
    }

    return res.status(500).json({
      success: false,
      message:
        "An error occurred while uploading model. Please try again later.",
    });
  }
};

const setDefaultModelController = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { modelId } = req.body;
    const { loggedInUser } = req;

    const existedUser = await User.findOne({ where: { id: loggedInUser.id } });

    if (!existedUser) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "User does not exist.",
      });
    }

    const campusId =
      loggedInUser.role === SUPER_ADMIN
        ? loggedInUser.campusId
        : existedUser.campus_id;

    const existedCampus = await Campus.findOne({
      where: { id: campusId },
    });

    if (!existedCampus) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Campus does not exist.",
      });
    }

    const modelToBeUpdated = await Model.findOne({
      where: {
        model_name: modelId,
        campus_id: existedCampus.id,
        is_deleted: false,
      },
      transaction,
    });

    if (!modelToBeUpdated) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Model does not exist.",
      });
    }

    if (modelToBeUpdated.is_default) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Model is already set to default.",
      });
    }

    // remove the default model
    await Model.update(
      { is_default: false },
      {
        where: {
          campus_id: existedCampus.id,
          is_deleted: false,
        },
        transaction,
      }
    );

    // set new default model
    await Model.update(
      { is_default: true },
      {
        where: {
          model_name: modelId,
          campus_id: existedCampus.id,
        },
        transaction,
      }
    );

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Model set to default successfully.",
    });
  } catch (error) {
    await transaction.rollback();

    logger.error(
      "An error occurred while setting default model : %s",
      error.message,
      { stack: error.stack }
    );

    return res.status(500).json({
      success: false,
      message:
        "An error occurred while setting default model. Please try again later.",
    });
  }
};

const getArchivedModelsController = async (req, res) => {
  try {
    const { loggedInUser } = req;
    const existedUser = await User.findOne({ where: { id: loggedInUser.id } });

    if (!existedUser) {
      return res.status(404).json({
        success: false,
        message: "User does not exist.",
      });
    }

    const campusId =
      loggedInUser.role === SUPER_ADMIN
        ? loggedInUser.campusId
        : existedUser.campus_id;

    const existedCampus = await Campus.findOne({
      where: { id: campusId },
    });

    if (!existedCampus) {
      return res.status(404).json({
        success: false,
        message: "Campus does not exist.",
      });
    }

    const deletedModels = await Model.findAll({
      where: { campus_id: campusId, is_deleted: true },
    });

    const data = deletedModels.map((model) => ({
      modelName: model.model_name,
      isDeleted: model.is_deleted,
      isDefault: model.is_default,
      deletedAt: model.deleted_at,
    }));

    return res.status(200).json({
      success: true,
      message: "Archived models fetched successfully.",
      data,
    });
  } catch (error) {
    logger.error(
      "An error occurred while getting deleted model : %s",
      error.message,
      { stack: error.stack }
    );

    return res.status(500).json({
      success: false,
      message:
        "An error occurred while getting deleted model. Please try again later.",
    });
  }
};

const restoreDeletedModelController = async (req, res) => {
  try {
    const { modelId } = req.body;
    const { loggedInUser } = req;

    const existedUser = await User.findOne({ where: { id: loggedInUser.id } });

    if (!existedUser) {
      return res.status(404).json({
        success: false,
        message: "User does not exist.",
      });
    }

    const campusId =
      loggedInUser.role === SUPER_ADMIN
        ? loggedInUser.campusId
        : existedUser.campus_id;

    const existedCampus = await Campus.findOne({
      where: { id: campusId },
    });

    if (!existedCampus) {
      return res.status(404).json({
        success: false,
        message: "Campus does not exist.",
      });
    }

    const existDeletedModel = await Model.findOne({
      where: { model_name: modelId, campus_id: campusId, is_deleted: true },
    });

    if (!existDeletedModel) {
      return res.status(404).json({
        success: false,
        message: "Model does not exist or not deleted.",
      });
    }

    await Model.update(
      { is_deleted: false, deleted_at: null },
      { where: { id: existDeletedModel.id } }
    );

    return res.status(200).json({
      success: true,
      message: "Model restored successfully.",
    });
  } catch (error) {
    logger.error(
      "An error occurred while restoring deleted model : %s",
      error.message,
      { stack: error.stack }
    );

    return res.status(500).json({
      success: false,
      message:
        "An error occurred while restoring deleted model. Please try again later.",
    });
  }
};

module.exports = {
  getAllModelsListController,
  deleteModelController,
  uploadModelController,
  setDefaultModelController,
  getArchivedModelsController,
  restoreDeletedModelController,
};
