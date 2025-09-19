const { USER_PREFIX } = require("../config/constants");

module.exports = (sequelize, DataTypes) => {
  const Campus = sequelize.define(
    "Campus",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      campus_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      campus_email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: {
            msg: "Invalid email format",
          },
        },
      },
      campus_phone: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      president_prefix: {
        type: DataTypes.ENUM,
        values: Object.keys(USER_PREFIX),
      },
      president_first_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      president_last_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      campus_website: {
        type: DataTypes.STRING,
        validate: {
          isUrl: {
            msg: "Invalid website URL",
          },
        },
      },
      campus_address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_activate: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_default: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      university_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      created_by: {
        type: DataTypes.INTEGER,
      },
      updated_by: {
        type: DataTypes.INTEGER,
      },
    },
    {
      tableName: "campus",
      timestamps: false,
    }
  );

  Campus.associate = function (models) {
    Campus.hasMany(models.User, {
      foreignKey: "campus_id",
      as: "users",
    });

    Campus.hasMany(models.Model, {
      foreignKey: "campus_id",
      as: "models",
    });

    Campus.hasMany(models.Student, {
      foreignKey: "campus_id",
      as: "campus",
    });

    Campus.belongsTo(models.University, {
      foreignKey: "university_id",
      as: "university",
    });
  };
  return Campus;
};
