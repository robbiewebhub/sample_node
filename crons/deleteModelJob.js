const cron = require("node-cron");
const { Model, sequelize } = require("../models");
const { getDateDaysDiff } = require("../utils/dateUtlis");
const { logger } = require("../utils/loggerUtils");
const { MODEL_BASE_URL } = require("../config/constants");
const axios = require("axios");

const deleteModelFromServer = async (model_name) => {
  try {
    const apiUrl = `${MODEL_BASE_URL}/delete-model/?model_id=${model_name}`;
    await axios.delete(apiUrl);
  } catch (error) {
    logger.error("Error occured: %s", error.message, { stack: error.stack });
  }
};

const handleDeleteModel = async (model) => {
  try {
    const daysPassedFromArchivedDate = getDateDaysDiff(model.deleted_at);

    if (daysPassedFromArchivedDate > 30) {
      await deleteModelFromServer(model.model_name);

      await Model.destroy({
        where: { id: model.id },
      });

      logger.info(
        `Model having id : ${model.id} , name : ${model.model_name} deleted successfully.`
      );
    }
  } catch (error) {
    logger.error("Unable To Delete Model : %s", error.message, {
      stack: error.stack,
    });
  }
};

const deleteModelJob = async () => {
  cron.schedule("0 0 * * *", async () => {
    const archivedModels = await Model.findAll({
      where: { is_deleted: true },
    });

    if (archivedModels?.length) {
      for (const model of archivedModels) {
        await handleDeleteModel(model);
      }
    }
  });
};

module.exports = deleteModelJob;
