const { DataTypes } = require("sequelize");
const {
  GENDER,
  ETHNICITY,
  ENROLLMENT_STATUS,
  GRADE_LEVEL,
  SEMESTER,
  FINANCING,
} = require("../config/constants");

module.exports = (sequelize) => {
  const BulkStudent = sequelize.define(
    "BulkStudent",
    {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
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
      date_of_birth: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      gender: {
        type: DataTypes.ENUM,
        values: Object.keys(GENDER),
        allowNull: false,
      },
      ethnicity: {
        type: DataTypes.ENUM,
        values: Object.keys(ETHNICITY),
        allowNull: false,
      },
      current_address: {
        type: DataTypes.TEXT,
      },
      permanent_address: {
        type: DataTypes.TEXT,
      },
      major: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      campus_id: {
        type: DataTypes.BIGINT,
      },
      disciplinary_records: {
        type: DataTypes.TEXT,
      },
      enrollment_status: {
        type: DataTypes.ENUM,
        values: Object.keys(ENROLLMENT_STATUS),
        allowNull: false,
      },
      semester: {
        type: DataTypes.ENUM,
        values: Object.keys(SEMESTER),
        allowNull: false,
      },
      grade_level: {
        type: DataTypes.ENUM,
        values: Object.keys(GRADE_LEVEL),
        allowNull: false,
      },
      minor: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      gpa: {
        type: DataTypes.DECIMAL(3, 2),
      },
      academic_advisor: {
        type: DataTypes.STRING,
      },
      clubs_organizations: {
        type: DataTypes.STRING,
      },
      volunteer_experience: {
        type: DataTypes.TEXT,
      },
      emergency_contact: {
        type: DataTypes.STRING,
      },
      phone_number: {
        type: DataTypes.STRING,
      },
      medical_records: {
        type: DataTypes.TEXT,
      },
      assigned_to: {
        type: DataTypes.BIGINT,
      },
      financing: {
        type: DataTypes.ENUM,
        values: Object.keys(FINANCING),
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
      tableName: "bulk_students",
      timestamps: false,
    }
  );

  BulkStudent.associate = function (models) {
    BulkStudent.belongsTo(models.Campus, {
      foreignKey: "campus_id",
      as: "campus",
    });

    BulkStudent.belongsTo(models.Major, {
      foreignKey: "major",
      as: "majorSubject",
      targetKey: "id",
    });

    BulkStudent.belongsToMany(models.Course, {
      through: "course_student_pivot",
      foreignKey: "student_id",
      otherKey: "course_id",
    });

    BulkStudent.hasMany(models.Attendance, {
      foreignKey: "student_id",
      as: "attendances",
    });
  };

  return BulkStudent;
};
