module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define(
    "Department",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      department_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
      tableName: "departments",
      timestamps: false,
    }
  );

  Department.associate = function (models) {
    Department.belongsTo(models.Role, {
      foreignKey: "role_id",
      as: "role",
    });

    Department.hasMany(models.User, {
      foreignKey: "department_id",
      as: "users",
    });
  };

  return Department;
};
