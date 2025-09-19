module.exports = (sequelize, DataTypes) => {
  const Recommendation = sequelize.define(
    "Recommendation",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      recommendation_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "recommendations",
      timestamps: false,
    }
  );

  Recommendation.associate = (models) => {};

  return Recommendation;
};
