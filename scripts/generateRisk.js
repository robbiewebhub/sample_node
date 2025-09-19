const { faker } = require("@faker-js/faker");
const { sequelize, Risk, Student } = require("../models");
const { logger } = require("../utils/loggerUtils");
const moment = require("moment");

const getRiskData = (student) => {
  const graduationProbability = parseFloat(
    faker.number
      .float({
        min: 0,
        max: 1,
        precision: 0.01,
      })
      .toFixed(2)
  );
  const dropoutProbability = 1 - graduationProbability;

  return {
    student_id: student.id,
    grad_probability: graduationProbability,
    dropout_probability: dropoutProbability,
    date_updated: moment().format("YYYY-MM-DD HH:mm:ss"),
  };
};

const generateRisk = async () => {
  const transaction = await sequelize.transaction();
  try {
    const lastRiskUpdated = await Risk.findOne({
      attributes: ["date_updated"],
      group: ["date_updated"],
      order: [["date_updated", "DESC"]],
      limit: 1,
    });

    const formattedDate = moment(lastRiskUpdated.date_updated).format(
      "YYYY-MM-DD"
    );

    const currentDate = moment().format("YYYY-MM-DD");

    if (moment(currentDate).diff(formattedDate, "days") > 7) {
      const students = await Student.findAll();

      let i = 1;
      for (const student of students) {
        const riskData = getRiskData(student);

        await Risk.create(riskData, { transaction });

        console.log(i);
        i++;
      }

      transaction.commit();
      logger.info("Risk entries inserted successfully.");
    } else {
      logger.error(`Risk last updated on ${formattedDate}.`);
    }
  } catch (error) {
    transaction.rollback();

    logger.error("An error occurred. %s", error.message, {
      stack: error.stack,
    });
  }
};

generateRisk();
