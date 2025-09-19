const { faker } = require("@faker-js/faker");
const { sequelize, Student, Gpa } = require("../models");
const { logger } = require("../utils/loggerUtils");

const getGpadata = (student) => {
  return {
    student_id: student.id,
    gpa: faker.number.float({ min: 0, max: 4, precision: 0.01 }),
    semester: 1,
  };
};

const generateGpa = async () => {
  const transaction = await sequelize.transaction();

  try {
    const students = await Student.findAll({ limit: 1000, offset: 100 });

    let index = 0;
    for (const student of students) {
      const studentGpa = getGpadata(student);

      await Gpa.create(studentGpa, { transaction });
      console.log(index);
      index++;
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();

    logger.error(
      "An error occurred while generating GPAs for students %s",
      error.message,
      { stack: error.stack }
    );
  }
};

generateGpa();
