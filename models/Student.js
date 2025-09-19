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
  const Student = sequelize.define(
    "Student",
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
      state: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      country: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      postal_code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "students",
      timestamps: false,
    }
  );

  Student.associate = function (models) {
    Student.belongsTo(models.Campus, {
      foreignKey: "campus_id",
      as: "campus",
    });

    Student.belongsTo(models.Major, {
      foreignKey: "major",
      as: "majorSubject",
      targetKey: "id",
    });

    Student.belongsTo(models.Minor, {
      foreignKey: "minor",
      as: "minorSubject",
      targetKey: "id",
    });

    Student.belongsToMany(models.Course, {
      through: "course_student_pivot",
      foreignKey: "student_id",
      otherKey: "course_id",
      as: "courses",
    });

    Student.hasMany(models.Attendance, {
      foreignKey: "student_id",
      as: "attendances",
    });

    Student.hasMany(models.Gpa, {
      foreignKey: "student_id",
      as: "gpas",
    });

    Student.belongsTo(models.User, {
      foreignKey: "assigned_to",
      as: "advisors",
    });

    Student.hasOne(models.Carelist, {
      foreignKey: "student_id",
      as: "carelist",
    });

    Student.hasMany(models.Risk, {
      foreignKey: "student_id",
      as: "risks",
    });

    Student.hasOne(models.AssignedRecommendation, {
      foreignKey: "student_id",
      as: "assignedRecommendation",
    });
  };

  return Student;
};
