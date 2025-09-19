const { SEMESTER } = require("../config/constants");

module.exports = (sequelize, DataTypes) => {
  const Gpa = sequelize.define(
    "Gpa",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      student_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      semester: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      gpa: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
      },
    },
    {
      tableName: "gpa",
      timestamps: false,
    }
  );

  Gpa.associate = (models) => {
    Gpa.belongsTo(models.Student, {
      foreignKey: "student_id",
      as: "student",
    });
  };

  return Gpa;
};
