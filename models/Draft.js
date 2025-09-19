const { DRAFT_TYPES } = require("../config/constants");

module.exports = (sequelize, DataTypes) => {
  const Draft = sequelize.define(
    "Draft",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM,
        values: Object.keys(DRAFT_TYPES),
        allowNull: false,
      },
      subject: {
        type: DataTypes.STRING,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: "drafts",
      timestamps: false,
    }
  );

  Draft.associate = function (models) {
    Draft.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
  };

  return Draft;
};
