module.exports = (sequelize, DataTypes) => {
  const University = sequelize.define(
    "University",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true,
      },
      website: {
        type: DataTypes.STRING,
        validate: {
          isUrl: {
            msg: "Invalid website URL",
          },
        },
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      is_activated: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "universities",
      timestamps: false,
    }
  );

  University.associate = function (models) {
    University.hasMany(models.Campus, {
      foreignKey: "university_id",
      as: "campuses",
    });

    University.hasMany(models.User, {
      foreignKey: "university_id",
      as: "users",
    });
  };

  return University;
};
