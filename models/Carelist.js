module.exports = (sequelize, DataTypes) => {
  const Carelist = sequelize.define(
    "Carelist",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      student_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      performance: {
        type: DataTypes.FLOAT,
      },
    },
    {
      tableName: "carelist",
      timestamps: false,
    }
  );

  Carelist.associate = function (models) {
    Carelist.belongsTo(models.Student, {
      foreignKey: "student_id",
      as: "student",
    });
  };

  return Carelist;
};
