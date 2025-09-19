module.exports = (sequelize, DataTypes) => {
  const Advisor = sequelize.define(
    "Advisor",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      advisor_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      advisor_email: {
        type: DataTypes.STRING,
        unique: true,
        validate: {
          isEmail: true,
        },
        allowNull: false,
      },
    },
    {
      tableName: "advisors",
      timestamps: false,
    }
  );

  Advisor.associate = (models) => {
    Advisor.hasMany(models.AssignedRecommendation, {
      foreignKey: "advisor_id",
      as: "assignedRecommendation",
    });
  };

  return Advisor;
};
