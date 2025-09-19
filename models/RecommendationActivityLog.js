const { COMMUNICATION_MODE } = require("../config/constants");

module.exports = (sequelize, DataTypes) => {
  const RecommendationActivityLog = sequelize.define(
    "RecommendationActivityLog",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      assigned_recommendation_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      communication_mode: {
        type: DataTypes.ENUM,
        values: Object.keys(COMMUNICATION_MODE),
        allowNull: false,
      },
    },
    {
      tableName: "recommendation_activity_log",
      timestamps: false,
    }
  );

  RecommendationActivityLog.associate = (models) => {};

  return RecommendationActivityLog;
};
