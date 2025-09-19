module.exports = (sequelize, DataTypes) => {
  const Major = sequelize.define(
    "Major",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      major_name: {
        type: DataTypes.STRING,
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
      tableName: "major",
      timestamps: false,
    }
  );

  Major.associate = function (models) {
    Major.hasMany(models.Student, {
      foreignKey: "major",
      as: "students",
    });
  };

  return Major;
};
