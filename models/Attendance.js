module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define(
    "Attendance",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      student_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      course_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      lecturer: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "attendance",
      timestamps: false,
    }
  );

  Attendance.associate = (models) => {
    Attendance.belongsTo(models.Student, {
      foreignKey: "student_id",
      as: "student",
    });

    Attendance.belongsTo(models.Course, {
      foreignKey: "course_id",
      as: "course",
    });
  };

  return Attendance;
};
