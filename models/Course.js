const { GRADE_LEVEL } = require("../config/constants");

module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define(
    "Course",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      grade_level: {
        type: DataTypes.ENUM,
        values: Object.keys(GRADE_LEVEL),
        allowNull: false,
      },
      course_name_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lecturer: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "courses",
      timestamps: false,
    }
  );

  Course.associate = (models) => {
    Course.belongsToMany(models.Student, {
      through: "course_student_pivot",
      foreignKey: "course_id",
      otherKey: "student_id",
      as: "students",
    });

    Course.hasMany(models.Attendance, {
      foreignKey: "course_id",
      as: "attendances",
    });
  };

  return Course;
};
