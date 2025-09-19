module.exports = (sequelize, DataTypes) => {
  const CourseStudentPivot = sequelize.define(
    "CourseStudentPivot",
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
      course_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
    },
    {
      tableName: "course_student_pivot",
      timestamps: false,
    }
  );

  return CourseStudentPivot;
};
