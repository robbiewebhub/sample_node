module.exports = (sequelize, DataTypes) => {
  const Risk = sequelize.define(
    "Risk",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      grad_probability: {
        type: DataTypes.FLOAT,
        defaultValue: DataTypes.NOW,
      },
      dropout_probability: {
        type: DataTypes.FLOAT,
        defaultValue: DataTypes.NOW,
      },
      date_updated: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "risk",
      timestamps: false,
    }
  );

  Risk.associate = function (models) {
    Risk.belongsTo(models.Student, {
      foreignKey: "student_id",
      as: "student",
    });
  };

  return Risk;
};
