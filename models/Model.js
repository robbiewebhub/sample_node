const { USER_PREFIX } = require("../config/constants");

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define(
    "Model",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      model_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      campus_id: {
        type: DataTypes.INTEGER,
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      created_by: {
        type: DataTypes.INTEGER,
      },
      deleted_at: {
        type: DataTypes.DATE,
      },
      is_default: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: "models",
      timestamps: false,
    }
  );

  Model.associate = function (models) {
    // Model.hasMany(models.User, {
    //   foreignKey: "created_by",
    //   as: "users",
    // });

    Model.belongsTo(models.Campus, {
      foreignKey: "campus_id",
      as: "campus",
    });
  };
  return Model;
};
