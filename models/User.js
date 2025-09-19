const { USER_PREFIX } = require("../config/constants");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      prefix: {
        type: DataTypes.ENUM,
        values: Object.keys(USER_PREFIX),
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      last_name: {
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
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      university_id: {
        type: DataTypes.INTEGER,
      },
      campus_id: {
        type: DataTypes.INTEGER,
      },
      department_id: {
        type: DataTypes.INTEGER,
      },
      attempts: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      is_activate: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_by: {
        type: DataTypes.INTEGER,
      },
      updated_by: {
        type: DataTypes.INTEGER,
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
      tableName: "users",
      timestamps: false,
      hooks: {
        beforeCreate: (user, options) => {
          if (!user.created_by) {
            user.created_by = 1; // Default logic for non-superadmin users
          }
          if (!user.updated_by) {
            user.updated_by = 1;
          }
        },
        beforeUpdate: (user, options) => {
          if (!user.updated_by) {
            user.updated_by = 1;
          }
        },
      },
    }
  );

  User.associate = function (models) {
    User.belongsTo(models.Role, {
      foreignKey: "role_id",
      as: "role",
    });

    User.belongsTo(models.Campus, {
      foreignKey: "campus_id",
      as: "campus",
    });

    User.belongsTo(models.Department, {
      foreignKey: "department_id",
      as: "department",
    });

    User.belongsTo(models.University, {
      foreignKey: "university_id",
      as: "university",
    });

    User.hasMany(models.Draft, {
      foreignKey: "user_id",
      as: "drafts",
    });

    User.hasMany(models.Student, {
      foreignKey: "assigned_to",
      as: "students",
    });
  };

  return User;
};
