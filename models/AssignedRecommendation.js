const { RECOMMEDATION_STATUS } = require("../config/constants");

module.exports = (sequelize, DataTypes) => {
  const AssignedRecommendation = sequelize.define(
    "AssignedRecommendation",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      recommendation_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      advisor_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      student_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      notes: {
        type: DataTypes.STRING,
      },
      progress_status: {
        type: DataTypes.ENUM,
        values: Object.keys(RECOMMEDATION_STATUS),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      risk_before: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
      },
      risk_after: {
        type: DataTypes.DECIMAL(3, 2),
      },
      date_assigned: {
        type: DataTypes.DATE,
        allowNull: false,
        default: DataTypes.NOW,
      },
      date_updated: {
        type: DataTypes.DATE,
        allowNull: false,
        default: DataTypes.NOW,
      },
    },
    {
      tableName: "assigned_recommendations",
      timestamps: false,
    }
  );

  AssignedRecommendation.associate = (models) => {
    AssignedRecommendation.belongsTo(models.Advisor, {
      foreignKey: "advisor_id",
      as: "advisor",
    });

    AssignedRecommendation.belongsTo(models.Student, {
      foreignKey: "student_id",
      as: "student",
    });
  };

  return AssignedRecommendation;
};
