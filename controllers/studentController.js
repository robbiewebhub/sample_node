const { Op, Sequelize } = require("sequelize");
const path = require("path");
const fs = require("fs");
const {
  Student,
  Major,
  Attendance,
  Campus,
  sequelize,
  Risk,
  Minor,
  Course,
  Draft,
  Gpa,
  User,
  Carelist,
} = require("../models");

const { getBirthdayRange } = require("../utils/dateUtlis");
const { logger } = require("../utils/loggerUtils");
const { getSumOfAgeCount } = require("../utils/helperUtils");

const {
  GPA_CONDITION,
  ROLES_MAPPING: { ADMIN, CAMPUS_ADMIN, SUPER_ADMIN },
} = require("../config/constants");

const moment = require("moment");
const sendToEmailQueue = require("../queues/riskEmailQueue/producer");

const getAllStudentsController = async (req, res) => {
  try {
    const {
      page,
      size,
      search,
      financing,
      ethnicity,
      unassignedStudents,
      major,
      gradeLevel,
      semester,
      enrollmentStatus,
      gender,
      age,
      gpaRange,
      carelist,
      riskLevel,
      country,
    } = req.query;

    const { loggedInUser } = req;

    let condition;
    if (
      (loggedInUser.role === ADMIN && loggedInUser?.campusId) ||
      (loggedInUser.role === SUPER_ADMIN && loggedInUser?.campusId)
    ) {
      condition = { campus_id: loggedInUser.campusId };
    } else {
      const campuses = await Campus.findAll({
        attributes: ["id"],
        where: { university_id: loggedInUser.universityId },
      });

      condition = {
        campus_id: {
          [Op.in]: campuses.map((campus) => campus.id),
        },
      };
    }

    const studentsCount = await Student.count({ where: { ...condition } });

    const filterConditions = {};

    const offset = (page - 1) * size;
    if (studentsCount > 0) {
      const totalPages = Math.ceil(studentsCount / size);

      if (page > totalPages) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid page number." });
      }
    }

    if (search) {
      filterConditions[Op.or] = [
        {
          name: {
            [Op.iLike]: `%${search}%`,
          },
        },
        {
          grade_level: Sequelize.literal(
            `"grade_level"::text ILIKE '%${search}%'`
          ),
        },
        {
          "$majorSubject.major_name$": {
            [Op.iLike]: `%${search}%`,
          },
        },
      ];
    }

    if (financing) {
      filterConditions.financing = financing;
    }

    if (ethnicity) {
      filterConditions.ethnicity = ethnicity;
    }

    if (unassignedStudents) {
      filterConditions.assigned_to = null;
    }

    if (major) filterConditions.major = major;

    if (gradeLevel) filterConditions.grade_level = gradeLevel;

    if (semester) filterConditions.semester = semester;

    if (enrollmentStatus) filterConditions.enrollment_status = enrollmentStatus;

    if (gender) filterConditions.gender = gender;

    if (age) {
      const { earliest: startDate, latest: endDate } = getBirthdayRange(age);

      filterConditions.date_of_birth = {
        [Op.gt]: startDate,
        [Op.lt]: endDate,
      };
    }

    if (country) filterConditions.country = { [Op.iLike]: `%${country}%` };

    let gpaCond = {};
    if (gpaRange) {
      gpaCond = {
        [Op.in]: sequelize.literal(
          `(SELECT student_id FROM gpa GROUP BY student_id HAVING AVG(gpa) ${GPA_CONDITION[gpaRange]})`
        ),
      };
    }

    let studentsInCarelist = [];
    if (carelist) {
      const carelistStudents = await Carelist.findAll();
      studentsInCarelist = [
        ...studentsInCarelist,
        ...carelistStudents.map((student) => student.student_id),
      ];
    }

    let riskLevelCond = {};

    if (riskLevel) {
      let conditions = "";

      if (riskLevel === "HIGH") {
        conditions = "grad_probability < 0.5";
      } else if (riskLevel === "LOW") {
        conditions = "grad_probability >= 0.75 AND grad_probability <= 1";
      } else if (riskLevel === "MODERATE") {
        conditions = "grad_probability >= 0.5 AND grad_probability < 0.75";
      }

      riskLevelCond = {
        [Op.in]: sequelize.literal(
          `(SELECT student_id FROM (SELECT DISTINCT ON (student_id) * from risk ORDER BY student_id, date_updated DESC) AS tmp WHERE ${conditions})`
        ),
      };
    }

    const students = await Student.findAll({
      where: {
        ...filterConditions,
        ...condition,
        id: { [Op.notIn]: studentsInCarelist, ...gpaCond, ...riskLevelCond },
      },
      include: [
        {
          model: Major,
          as: "majorSubject",
        },
      ],
      order: [["id", "DESC"]],
      offset,
      limit: +size,
    });

    const filteredStudents = await Student.count({
      where: {
        ...filterConditions,
        ...condition,
        id: { [Op.notIn]: studentsInCarelist, ...gpaCond, ...riskLevelCond },
      },
      include: [
        {
          model: Major,
          as: "majorSubject",
        },
      ],
      order: [["id", "DESC"]],
    });

    const data = {};
    data.students = await Promise.all(
      students.map(async (student) => {
        const studentCampus = await student.getCampus();
        const studentRisk = await Risk.findOne({
          where: { student_id: student.id },
          order: [["date_updated", "DESC"]],
        });

        const studentGpa = await Gpa.findOne({
          attributes: [
            [
              Sequelize.fn(
                "ROUND",
                Sequelize.fn("AVG", Sequelize.col("gpa")),
                2
              ),
              "averageGpa",
            ],
          ],
          where: { student_id: student.id },
        });
        return {
          id: student.id,
          name: student.name,
          ethnicity: student.ethnicity,
          gradeLevel: student.grade_level,
          major: student?.majorSubject?.major_name,
          financing: student?.financing,
          assignedTo: student.assignedTo,
          gpa: studentGpa.get("averageGpa"),
          graduationProbablity: studentRisk?.grad_probability,
          campus: studentCampus.campus_name,
          country: student.country,
        };
      })
    );

    data.total = studentsCount;
    data.filtered = filteredStudents;

    return res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error(
      "An error occured while fetching students : %s",
      error.message,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while fetching students. Please try again later.",
    });
  }
};

const getStudentByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id, {
      include: [
        {
          model: Major,
          as: "majorSubject",
        },
        {
          model: Minor,
          as: "minorSubject",
        },
        {
          model: Course,
          as: "courses",
          attributes: ["name", "course_name_id", "id", "lecturer"],
          through: {
            attributes: [],
          },
        },
        {
          model: Carelist,
          as: "carelist",
        },
      ],
    });

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student does not exist." });
    }

    const studentCampus = await student.getCampus();
    const studentRisk = await Risk.findOne({
      where: { student_id: student.id },
      order: [["date_updated", "DESC"]],
    });
    const studentCourses = student.courses.map((course) => ({
      id: course.id,
      courseId: course.course_name_id,
      name: course.name,
      lecturer: course.lecturer,
    }));

    const studentGpa = await Gpa.findOne({
      attributes: [
        [
          Sequelize.fn("ROUND", Sequelize.fn("AVG", Sequelize.col("gpa")), 2),
          "averageGpa",
        ],
      ],
      where: { student_id: student.id },
    });

    return res.status(200).json({
      success: true,
      message: "Student fetched successfully.",
      data: {
        id: student.id,
        enrollmentStatus: student.enrollment_status,
        name: student.name,
        gradeLevel: student.grade_level,
        clubsOrganizations: student.clubs_organizations,
        dateOfBirth: student.date_of_birth,
        major: student?.majorSubject?.major_name,
        volunteerExperience: student.volunteer_experience,
        gender: student.gender,
        minor: student?.minorSubject?.minor_name,
        emergencyContact: student.emergency_contact,
        ethnicity: student.ethnicity,
        courses: student?.courses,
        phoneNumber: student.phone_number,
        permanentAddress: student.permanent_address,
        // gpa: student.gpa,
        gpa: studentGpa.get("averageGpa"),
        medicalRecords: student.medical_records,
        currentAddress: student.current_address,
        academicAdvisor: student.academic_advisor,
        email: student.email,
        disciplinaryRecords: student.disciplinary_records,
        financing: student?.financing,
        assignedTo: student.assignedTo,
        graduationProbablity: studentRisk.grad_probability,
        semester: student.semester,
        campus: studentCampus.campus_name,
        courses: studentCourses,
        isCarelisted: student?.carelist?.id ? true : false,
      },
    });
  } catch (error) {
    logger.error(
      "An error occured while fetching student details : %s",
      error.message,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while fetching student details. Please try again later.",
    });
  }
};

const getDemographicsController = async (req, res) => {
  try {
    const { loggedInUser } = req;
    const { startDate, endDate, passFailType } = req.query;

    const condition = {};
    let conditionForQuery = "";

    if (
      (loggedInUser.role === ADMIN && loggedInUser?.campusId) ||
      loggedInUser.role === CAMPUS_ADMIN ||
      (loggedInUser.role === SUPER_ADMIN && loggedInUser?.campusId)
    ) {
      condition.campus_id = loggedInUser.campusId;
      conditionForQuery += ` AND s.campus_id = '${loggedInUser.campusId}'`;
    } else if (loggedInUser.role === ADMIN && !loggedInUser?.campusId) {
      const campuses = await Campus.findAll({
        attributes: ["id"],
        where: { university_id: loggedInUser.universityId },
      });
      condition.campus_id = { [Op.in]: campuses.map((campus) => campus.id) };
      conditionForQuery += ` AND s.campus_id in (${campuses
        .map((campus) => campus.id)
        .join(",")})`;
    }

    const filterConditions = {};
    let filterConditionForQuery = "";
    if (startDate && endDate) {
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);

      parsedStartDate.setHours(0, 0, 0, 0);

      parsedEndDate.setHours(23, 59, 59, 999);

      if (parsedEndDate < parsedStartDate) {
        return res.status(400).json({
          success: false,
          message: "End date should be greater than start date.",
        });
      }

      filterConditions.created_at = {
        [Op.between]: [parsedStartDate, parsedEndDate],
      };

      filterConditionForQuery += ` AND DATE(s.created_at) >= '${startDate}' AND DATE(s.created_at) <= '${endDate}'`;
    }

    /* ------------------------------ Student Count ----------------------------- */
    const [
      totalStudents,
      totalMaleStudents,
      totalFemaleStudents,
      totalOthersStudents,
    ] = await Promise.all([
      Student.count({ where: { ...condition, ...filterConditions } }),
      Student.count({
        where: { gender: "MALE", ...condition, ...filterConditions },
      }),
      Student.count({
        where: { gender: "FEMALE", ...condition, ...filterConditions },
      }),
      Student.count({
        where: { gender: "OTHERS", ...condition, ...filterConditions },
      }),
    ]);

    /* ---------------------------- Ethnicity Details --------------------------- */
    const ethincityCount = await Student.findAll({
      attributes: [
        "ethnicity",
        [Sequelize.fn("COUNT", Sequelize.col("ethnicity")), "count"],
      ],
      where: { ...condition, ...filterConditions },
      group: ["ethnicity"],
    });

    const ethnicityDistribution = ethincityCount.map((item) => ({
      ethnicity: item.ethnicity,
      count: item.get("count"),
      percentage: +((item.get("count") / totalStudents) * 100).toFixed(2),
    }));

    /* ---------------------------- Financing Details --------------------------- */
    const financingCount = await Student.findAll({
      attributes: [
        "financing",
        [Sequelize.fn("COUNT", Sequelize.col("financing")), "count"],
      ],
      where: { ...condition, ...filterConditions },
      group: ["financing"],
    });

    const financing = financingCount.map((item) => ({
      ethnicity: item.financing,
      count: item.get("count"),
      percentage: +((item.get("count") / totalStudents) * 100).toFixed(2),
    }));

    /* ---------------------------- Age Distribution ---------------------------- */

    const studentAgeWiseCount = await Student.findAll({
      attributes: [
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
        [
          Sequelize.fn(
            "EXTRACT",
            Sequelize.literal('YEAR FROM AGE("date_of_birth")')
          ),
          "age",
        ],
      ],
      where: { ...condition, ...filterConditions },
      group: [Sequelize.literal('EXTRACT(YEAR FROM AGE("date_of_birth"))')],
      order: [
        [
          Sequelize.fn(
            "EXTRACT",
            Sequelize.literal('YEAR FROM AGE("date_of_birth")')
          ),
          "DESC",
        ],
      ],
    });

    const ageArray = studentAgeWiseCount.map((student) => student.get("age"));
    const maxAge = Math.max(...ageArray);
    const minAge = Math.min(...ageArray);

    const pairGap = Math.ceil((maxAge - minAge + 1) / 4);

    ageArray.sort();

    let ageDistribution = {};
    if (ageArray.length > 4) {
      let rowCount = 0;
      for (let i = minAge; i <= maxAge; i += pairGap) {
        if (rowCount > 2) {
          ageDistribution[`${i}+`] = getSumOfAgeCount(
            i,
            "",
            studentAgeWiseCount
          );
          break;
        } else {
          ageDistribution[`${i}-${i + (pairGap - 1)}`] = getSumOfAgeCount(
            i,
            i + (pairGap - 1),
            studentAgeWiseCount
          );
        }
        rowCount++;
      }
    } else {
      ageDistribution = studentAgeWiseCount.reduce((acc, student) => {
        const age = student.get("age");
        const count = +student.get("count");
        acc[age] = count;

        return acc;
      }, {});
    }

    /* ---------------------------- Pass Vs Fail Rate --------------------------- */
    const columnName = passFailType === "GENDER" ? "s.gender" : "s.ethnicity";

    const [passFailCount] = await sequelize.query(`
      SELECT
      (CASE WHEN tmp.gpa > 2 THEN 'pass' ELSE 'fail' END) AS result,
      COUNT(*) as pass_fail_count,
      ${columnName} AS type
      FROM (SELECT ROUND(AVG(gpa), 2) as gpa, student_id  from gpa GROUP BY student_id) tmp
      JOIN students s on s.id=tmp.student_id
      WHERE 1=1
      ${conditionForQuery}
      ${filterConditionForQuery}
      GROUP BY result, ${columnName};
    `);

    const passFailByType = passFailCount.reduce((acc, val) => {
      if (acc[val.type]) {
        if (acc[val.type][val.result]) {
          acc[val.type][val.result] += +val.pass_fail_count;
        } else {
          acc[val.type][val.result] = +val.pass_fail_count;
        }
      } else {
        acc[val.type] = {};
        acc[val.type][val.result] = +val.pass_fail_count;
      }

      return acc;
    }, {});

    const passFailRate = [];

    for (let property in passFailByType) {
      const { pass = 0, fail = 0 } = passFailByType[property];

      passFailRate.push({
        type: property,
        passRate: +((pass / (pass + fail)) * 100).toFixed(2),
        failRate: +((fail / (pass + fail)) * 100).toFixed(2),
      });
    }
    const data = {
      studentDemographics: {
        totalStudents,
        totalMaleStudents,
        totalFemaleStudents,
        totalOthersStudents,
        malePercentage: +((totalMaleStudents / totalStudents) * 100).toFixed(2),
        femalePercentage: +(
          (totalFemaleStudents / totalStudents) *
          100
        ).toFixed(2),
        otherPercentage: +((totalOthersStudents / totalStudents) * 100).toFixed(
          2
        ),
      },

      ethnicityDistribution,

      financing,

      ageDistribution,

      passFailRate,
    };

    return res.status(200).json({
      success: true,
      message: "Demographics fetched successfully.",
      data,
    });
  } catch (error) {
    logger.error(
      "An error occured while fetching demographics : %s",
      error.message,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while fethcing demographics. Please try again later.",
    });
  }
};

const getAttendanceData = async (campusId, startDate, endDate) => {
  try {
    const totalEvents = await Student.count({
      where: { campus_id: campusId },
    });

    const attendedEvents = await Attendance.count({
      distinct: true,
      col: "student_id",
      include: [
        {
          model: Student,
          as: "student",
          where: { campus_id: campusId },
        },
      ],
      where: { status: true, date: { [Op.between]: [startDate, endDate] } },
    });

    return {
      totalEvents,
      attendedEvents,
    };
  } catch (error) {
    logger.error(
      "An error occured while fetching attendance data : %s",
      error.message,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while fethcing attendance data. Please try again later.",
    });
  }
};

const calculatePercentageChange = (currentRate, previousRate) => {
  if (previousRate === 0) return currentRate > 0 ? 100 : 0;
  const change = ((currentRate - previousRate) / previousRate) * 100;
  return change.toFixed(2);
};

const getAttendanceController = async (req, res) => {
  try {
    const { loggedInUser } = req;

    const endDate = moment().format("YYYY-MM-DD");
    const startDate = moment().startOf("month").format("YYYY-MM-DD");

    const currentAttendanceData = await getAttendanceData(
      loggedInUser.campusId,
      startDate,
      endDate
    );

    let attendanceRate = 0;

    if (currentAttendanceData.totalEvents > 0) {
      attendanceRate =
        (currentAttendanceData.attendedEvents /
          currentAttendanceData.totalEvents) *
        100;
    }

    const previousMonthStartDate = moment()
      .subtract(1, "month")
      .startOf("month")
      .format("YYYY-MM-DD");

    const previousMonthEndDate = moment()
      .subtract(1, "month")
      .endOf("month")
      .format("YYYY-MM-DD");

    const previousAttendanceData = await getAttendanceData(
      loggedInUser.campusId,
      previousMonthStartDate,
      previousMonthEndDate
    );

    let previosAttendanceRate = 0;

    if (previousAttendanceData.totalEvents > 0) {
      previosAttendanceRate =
        (previousAttendanceData.attendedEvents /
          previousAttendanceData.totalEvents) *
        100;
    }

    const precentChange = calculatePercentageChange(
      attendanceRate,
      previosAttendanceRate
    );

    const data = {
      attendance: {
        attendanceRate,
        precentChange,
      },
    };

    return res.status(200).json({
      success: true,
      message: "Attendance data fetched successfull.",
      data,
    });
  } catch (error) {
    logger.error(
      "An error occured while fetching attendance : %s",
      error.message,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while fethcing attendance. Please try again later.",
    });
  }
};

/* -------------------------------------------------------------------------- */
/*                                    RISK                                    */
/* -------------------------------------------------------------------------- */

const getRiskDates = async () => {
  const latestDate = await Risk.findOne({
    attributes: [
      [sequelize.fn("DATE", sequelize.col("date_updated")), "date_updated"],
    ],
    group: [sequelize.fn("DATE", sequelize.col("date_updated"))],
    order: [[sequelize.fn("DATE", sequelize.col("date_updated")), "DESC"]],
    limit: 1,
  });

  const previousDate = await Risk.findOne({
    attributes: [
      [sequelize.fn("DATE", sequelize.col("date_updated")), "date_updated"],
    ],
    group: [sequelize.fn("DATE", sequelize.col("date_updated"))],
    order: [[sequelize.fn("DATE", sequelize.col("date_updated")), "DESC"]],
    limit: 1,
    offset: 1,
  });

  const formattedLatestDate = moment(latestDate.date_updated).format(
    "YYYY-MM-DD"
  );
  const formattedPreivousDate = moment(previousDate.date_updated).format(
    "YYYY-MM-DD"
  );

  return { formattedLatestDate, formattedPreivousDate };
};

const getTotalRiskStudents = async (formattedDate, campuses, dropoutTotal) => {
  const dropoutCondition = {};

  if (dropoutTotal === true) {
    dropoutCondition.dropout_probability = { [Op.gt]: 0.5 };
  }

  return await Risk.count({
    where: {
      date_updated: {
        [Op.gte]: new Date(formattedDate + "T00:00:00.000Z"),
        [Op.lt]: new Date(
          moment(formattedDate).add(1, "days").format("YYYY-MM-DD") +
            "T00:00:00.000Z"
        ),
      },
      ...dropoutCondition,
    },
    include: {
      model: Student,
      as: "student",
      where: {
        campus_id: { [Op.in]: campuses },
      },
    },
  });
};

const getDropoutStudentsRatio = async (formattedDate, campuses) => {
  const dropoutStudents = await Risk.count({
    where: {
      date_updated: {
        [Op.gte]: new Date(formattedDate + "T00:00:00.000Z"),
        [Op.lt]: new Date(
          moment(formattedDate).add(1, "days").format("YYYY-MM-DD") +
            "T00:00:00.000Z"
        ),
      },
      dropout_probability: { [Op.gt]: 0.5 },
    },
    include: {
      model: Student,
      as: "student",
      where: {
        campus_id: { [Op.in]: campuses },
      },
    },
  });

  const totalStudents = await getTotalRiskStudents(formattedDate, campuses);

  const dropoutRatio = parseFloat(
    ((dropoutStudents / totalStudents) * 100).toFixed(2)
  );

  return dropoutRatio;
};

const getDropoutRate = async (campuses) => {
  const { formattedLatestDate, formattedPreivousDate } = await getRiskDates();

  const latestDropoutRatio = await getDropoutStudentsRatio(
    formattedLatestDate,
    campuses
  );

  const previousDropoutRatio = await getDropoutStudentsRatio(
    formattedPreivousDate,
    campuses
  );

  const ratioDeviation =
    previousDropoutRatio >= 1
      ? parseFloat(
          (
            ((latestDropoutRatio - previousDropoutRatio) /
              previousDropoutRatio) *
            100
          ).toFixed(2)
        )
      : latestDropoutRatio;

  return {
    latestDropoutRatio,
    previousDropoutRatio,
    ratioDeviation,
  };
};

const getRiskDeviation = async (campuses) => {
  const { formattedLatestDate, formattedPreivousDate } = await getRiskDates();

  const latestTotalStudents = await getTotalRiskStudents(
    formattedLatestDate,
    campuses,
    true
  );
  const previousTotalStudents = await getTotalRiskStudents(
    formattedPreivousDate,
    campuses,
    true
  );

  const deviation =
    previousTotalStudents >= 1
      ? parseFloat(
          (
            ((latestTotalStudents - previousTotalStudents) /
              previousTotalStudents) *
            100
          ).toFixed(2)
        )
      : latestTotalStudents;

  return deviation;
};

const getRiskedStudentsController = async (req, res) => {
  try {
    const { search, page, size } = req.query;
    const { loggedInUser } = req;

    let campuses = [];
    if (!loggedInUser?.campusId) {
      const universityCampuses = await Campus.findAll({
        where: { university_id: loggedInUser.universityId },
      });

      campuses = universityCampuses.map((campus) => campus.id);
    } else {
      campuses = [loggedInUser.campusId];
    }

    const riskedStudentsCount = await sequelize.query(
      `
      SELECT
          count(*)
      FROM
          students s
      LEFT JOIN (
          SELECT DISTINCT ON (student_id) *
          FROM risk
          ORDER BY student_id, date_updated DESC
      ) r ON s.id = r.student_id
      LEFT JOIN major m ON s.major=m.id
      WHERE r.dropout_probability > 0.5
      AND campus_id in (${campuses.join(",")})
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    const offset = (page - 1) * size;
    if (riskedStudentsCount[0].count > 0) {
      const totalPages = Math.ceil(riskedStudentsCount[0].count / size);

      if (page > totalPages) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid page number." });
      }
    }

    let searchConditions = "";
    if (search) {
      searchConditions += ` AND (s.name ILIKE '%${search}%' OR m.major_name ILIKE '%${search}%' OR s.grade_level::text ILIKE '%${search}%')`;
    }

    const studentsAtRisk = await sequelize.query(
      `
      SELECT
          s.id as id, s.name as name, s.email as email, s.grade_level as grade_level,
          r.grad_probability as grad_probability, r.dropout_probability as dropout_probability,
          m.major_name as major_name, (SELECT ROUND(AVG(gpa), 2) FROM gpa WHERE student_id=s.id) AS gpa
      FROM
          students s
      LEFT JOIN (
          SELECT DISTINCT ON (student_id) *
          FROM risk
          ORDER BY student_id, date_updated DESC
      ) r ON s.id = r.student_id
      LEFT JOIN major m ON s.major=m.id
      WHERE r.dropout_probability > 0.5
      AND campus_id in (${campuses.join(",")})
      ${searchConditions}
      ORDER BY s.id
      LIMIT ${size} OFFSET ${offset};
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    const riskedStudentsfiltered = await sequelize.query(
      `
      SELECT
          count(*)
      FROM
          students s
      LEFT JOIN (
          SELECT DISTINCT ON (student_id) *
          FROM risk
          ORDER BY student_id, date_updated DESC
      ) r ON s.id = r.student_id
      LEFT JOIN major m ON s.major=m.id
      WHERE r.dropout_probability > 0.5
      AND campus_id in (${campuses.join(",")})
       ${searchConditions}
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    const dropoutRate = await getDropoutRate(campuses);

    const riskDeviation = await getRiskDeviation(campuses);

    const data = {};
    data.students = studentsAtRisk.map((student) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      major: student.major_name,
      graduationProbablity: student.grad_probability,
      dropoutProbability: student.dropout_probability,
      gpa: +student.gpa,
      gradeLevel: student.grade_level,
    }));

    data.total = riskedStudentsCount[0].count;
    data.filtered = riskedStudentsfiltered[0].count;
    data.dropoutRate = dropoutRate;
    data.studentDeviation = riskDeviation;

    return res.status(200).json({
      success: true,
      message: "Students fetched successfully.",
      data,
    });
  } catch (error) {
    logger.error(
      "An error occured while fetching risked students : %s",
      error.message,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while fetching risked students. Please try again later.",
    });
  }
};

/* -------------------------------------------------------------------------- */

const getDraftMessagesController = async (req, res) => {
  try {
    const { loggedInUser } = req;
    const { type } = req.query;

    const draftMessages = await Draft.findOne({
      where: { user_id: loggedInUser.id, type },
      attributes: ["id", "message", "subject"],
    });

    res.status(200).json({
      success: true,
      message: "Draft fetched successfully.",
      data: draftMessages,
    });
  } catch (error) {
    logger.error(
      "An error occured while fetching draft messages : %s",
      error.message,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while fetching draft messages. Please try again later.",
    });
  }
};

const saveDraftMessageController = async (req, res) => {
  try {
    const { id, message, type, subject } = req.body;
    const { loggedInUser } = req;

    if (id) {
      const draftMessageExist = await Draft.findOne({
        where: { id },
      });

      if (!draftMessageExist) {
        return res
          .status(404)
          .json({ success: false, message: "Draft message not exist." });
      }

      await Draft.update({ message, subject }, { where: { id } });
    } else {
      const draftExist = await Draft.findOne({
        where: { type, user_id: loggedInUser.id },
      });

      if (draftExist) {
        return res
          .status(200)
          .json({ success: false, message: "Draft already exist." });
      }

      await Draft.create({
        user_id: loggedInUser.id,
        type,
        message,
        subject,
      });
    }

    res
      .status(200)
      .json({ success: true, message: "Draft saved successfully." });
  } catch (error) {
    logger.error(
      "An error occured while fetching draft messages : %s",
      error.message,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while fetching draft messages. Please try again later.",
    });
  }
};

const sendRiskMailController = async (req, res) => {
  try {
    const { emails, message, subject } = req.body;
    const attachments = req.files.map((file) => {
      const filePath = path.join("./uploads/attachments", file.filename);
      const fileContent = fs.readFileSync(filePath, { encoding: "base64" });
      return {
        content: fileContent,
        filename: file.originalname,
        type: file.mimetype,
        decomposition: "attachment",
      };
    });

    const students = await Student.findAll({
      where: {
        email: {
          [Op.in]: emails,
        },
      },
      include: [
        {
          model: User,
          as: "advisors",
          attributes: ["email", "first_name", "phone"],
        },
        {
          model: Campus,
          as: "campus",
          attributes: [
            "campus_name",
            "campus_email",
            "campus_address",
            "campus_phone",
            "president_first_name",
          ],
        },
      ],
    });

    const exsistingStudentEmail = students.map((student) => student.email);

    if (!exsistingStudentEmail?.length) {
      return res.status(404).json({
        success: false,
        message: `Students having email (${emails.join(", ")}) does not exist.`,
      });
    }

    const notExistStudents = emails.filter(
      (email) => !exsistingStudentEmail.includes(email)
    );

    if (notExistStudents.length) {
      return res.status(404).json({
        success: false,
        message: `Students having email (${notExistStudents.join(
          ", "
        )}) does not exist.`,
      });
    }

    const studentsData = await Promise.all(
      students.map(async (student) => {
        const Risk = await sequelize.query(
          `
          SELECT (CASE WHEN grad_probability < 0.5 THEN 'HIGH'
          WHEN grad_probability >= 0.5 AND grad_probability < 0.75 THEN 'MODERATE'
          WHEN grad_probability >= 0.75 AND grad_probability <= 1 THEN 'LOW'
          ELSE 'UNKNOWN' END) AS risk_level
          FROM risk WHERE student_id=${student.id} ORDER BY date_updated Limit 1
          `,
          {
            type: sequelize.QueryTypes.SELECT,
          }
        );

        return {
          id: student.id,
          name: student.name,
          email: student.email,
          phone: student.phone_number,
          year: student.grade_level,
          semester: student.semester,
          riskLevel: Risk[0].risk_level,
          advisorName: student?.advisors?.first_name,
          advisorEmail: student?.advisors?.email,
          advisorPhone: student?.advisors?.phone,
          collegeName: student.campus.campus_name,
          collegeAddress: student.campus.campus_address,
          collegeContact: student.campus.campus_phone,
          collegePresident: student.campus.president_first_name,
        };
      })
    );

    sendToEmailQueue({ students: studentsData, message, subject, attachments });
    return res
      .status(200)
      .json({ success: true, message: "Email send successfully." });
  } catch (error) {
    logger.error(
      "An error occured while sending risk email : %s",
      error.message,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while sending risk email. Please try again later.",
    });
  }
};

const addStudentUnderCareListController = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { students } = req.body;

    const existingStudents = await Student.findAll({
      where: { id: { [Op.in]: students } },
      transaction,
    });

    if (
      !existingStudents.length ||
      existingStudents.length !== students.length
    ) {
      transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Please provide valid students list.",
      });
    }

    const existStudentInCarelist = await Carelist.findOne({
      where: { student_id: { [Op.in]: students } },
      transaction,
    });

    if (existStudentInCarelist) {
      transaction.rollback();

      return res
        .status(409)
        .json({ success: false, message: "Students already in carelist." });
    }

    for (let studentId of students) {
      await Carelist.create(
        {
          student_id: studentId,
          performance: (Math.random() * 100).toFixed(2),
        },
        { transaction }
      );
    }
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Students added to carelist successfully.",
    });
  } catch (error) {
    await transaction.rollback();

    logger.error(
      "An error occurred while adding students to carelist : %s",
      error.message,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while adding students to carelist. Please try again later.",
    });
  }
};

const undoCarelistedStudentController = async (req, res) => {
  try {
    const { students } = req.body;

    const existingStudents = await Student.findAll({
      where: { id: { [Op.in]: students } },
    });

    if (
      !existingStudents.length ||
      existingStudents.length !== students.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid students list.",
      });
    }

    const existStudentInCarelist = await Carelist.findAll({
      where: { student_id: { [Op.in]: students } },
    });

    if (
      !existStudentInCarelist.length ||
      existStudentInCarelist.length !== students.length
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Students not exist in carelist." });
    }

    await Carelist.destroy({ where: { student_id: { [Op.in]: students } } });

    return res.status(200).json({
      success: true,
      message: "Carelisted students reverted successfully.",
    });
  } catch (error) {
    logger.error(
      "An error occurred while undo students to carelist : %s",
      error.message,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while undo students to carelist. Please try again later.",
    });
  }
};

const showCarelistController = async (req, res) => {
  try {
    const { page, size, search } = req.query;
    const { loggedInUser } = req;

    let queryCondition = "";
    let condition = {};
    if (
      (loggedInUser.role === ADMIN && loggedInUser?.campusId) ||
      (loggedInUser.role === SUPER_ADMIN && loggedInUser?.campusId)
    ) {
      condition = { "$student.campus_id$": loggedInUser.campusId };
      queryCondition += ` AND s.campus_id=${loggedInUser.campusId}`;
    } else {
      const campuses = await Campus.findAll({
        attributes: ["id"],
        where: { university_id: loggedInUser.universityId },
      });

      condition = {
        "$student.campus_id$": {
          [Op.in]: campuses.map((campus) => campus.id),
        },
      };
      queryCondition += ` AND s.campus_id IN (${campuses
        .map((campus) => campus.id)
        .join(",")})`;
    }

    let searchQueryCondition = "";

    if (search) {
      searchQueryCondition += ` AND (  s.name ILIKE '%${search}%' OR
      s.grade_level::text ILIKE '%${search}%' OR
      m.major_name ILIKE '%${search}%') `;
    }

    const studentsCount = await Carelist.count({
      where: { ...condition },
      include: [
        {
          model: Student,
          as: "student",
          attributes: ["id"],
        },
      ],
    });

    const offset = (page - 1) * size;
    if (studentsCount) {
      const totalPages = Math.ceil(studentsCount / size);

      if (page > totalPages) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid page number." });
      }
    }

    const carelistStudents = await sequelize.query(
      `
        SELECT 
          c.id AS carelist_id, 
          c.performance,
          s.id AS student_id, 
          s.name, 
          s.enrollment_status, 
          s.grade_level, 
          m.id AS major_id, 
          m.major_name
        FROM 
          carelist c
        JOIN 
          students s ON c.student_id = s.id
        LEFT JOIN 
          major AS m ON s.major = m.id
        WHERE 
          1=1 ${searchQueryCondition} ${queryCondition}
        LIMIT ${size}
        OFFSET ${offset};
      `,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const studentsWithRisk = await Promise.all(
      carelistStudents.map(async (student) => {
        const studentRisk = await Risk.findOne({
          attributes: ["grad_probability", "dropout_probability"],
          where: { student_id: student.student_id },
          order: [["date_updated", "DESC"]],
        });

        const studentGpa = await Gpa.findOne({
          attributes: [
            [
              Sequelize.fn(
                "ROUND",
                Sequelize.fn("AVG", Sequelize.col("gpa")),
                2
              ),
              "averageGpa",
            ],
          ],
          where: { student_id: student.student_id },
        });

        return {
          id: student.student_id,
          name: student.name,
          gpa: +studentGpa?.get("averageGpa"),
          gradeLevel: student.grade_level,
          major: student.major_name,
          performance: student.performance,
          graduationProbability: studentRisk?.grad_probability,
          dropoutProbability: studentRisk?.dropout_probability,
        };
      })
    );

    const filteredStudents = await sequelize.query(
      `
        SELECT COUNT(*) AS total_count
        FROM carelist c
        JOIN students s ON c.student_id = s.id
        LEFT JOIN major AS m ON s.major = m.id
        WHERE 
        1=1  ${searchQueryCondition} ${queryCondition}
      `,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const studentAverageRisks = await sequelize.query(
      `
        SELECT
          r.grad_probability
        FROM
          students s
        JOIN carelist c ON c.student_id=s.id 
        LEFT JOIN (
          SELECT DISTINCT ON (student_id) *
          FROM risk
          ORDER BY student_id, date_updated DESC
        ) r ON s.id = r.student_id
        WHERE 1=1 ${queryCondition}`,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const highRiskCount = studentAverageRisks.filter(
      (student) => student.grad_probability < 0.5
    ).length;

    const moderateRiskCount = studentAverageRisks.filter(
      (student) =>
        student.grad_probability >= 0.5 && student.grad_probability < 0.75
    ).length;

    const lowRiskCount = studentAverageRisks.filter(
      (student) =>
        student.grad_probability >= 0.75 && student.grad_probability <= 1
    ).length;

    const data = {};
    data.students = studentsWithRisk;
    data.totalStudents = studentsCount;
    data.highRiskStudents = highRiskCount;
    data.moderateRiskStudents = moderateRiskCount;
    data.lowRiskStudents = lowRiskCount;

    data.total = studentsCount;
    data.filtered = +filteredStudents[0].total_count;

    return res.status(200).json({
      success: true,
      message: "Carelisted students fetched successfully.",
      data,
    });
  } catch (error) {
    logger.error(
      "An error occurred while fetching carelist students : %s",
      error.message,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while fetching carelist students. Please try again later.",
    });
  }
};

/* -------------------------------------------------------------------------- */
/*                            Country Demographics                            */
/* -------------------------------------------------------------------------- */

const getUsBasedAndInternalStudentCount = async (condition) => {
  const usBasedStudents = await Student.count({
    where: { country: "US", ...condition },
  });

  const totalStudents = await Student.count({ where: { ...condition } });

  const internaltionalStudents = totalStudents - usBasedStudents;

  return { usBasedStudents, internaltionalStudents };
};

const getUSStudentData = async (condition) => {
  const countryData = await Student.count({
    where: { country: "US", ...condition },
    attributes: [
      [sequelize.fn("COUNT", sequelize.col("state")), "count"],
      "state",
      "postal_code",
    ],
    group: ["state", "postal_code"],
  });

  const totalStudents = await Student.count({
    where: { country: "US", ...condition },
  });

  const usChartData = countryData.map((data) => {
    return {
      name: data.state,
      code: data.postal_code,
      count: data.count,
      percentage: parseFloat(((data.count / totalStudents) * 100).toFixed(2)),
    };
  });

  return usChartData;
};

const getInternationalData = async (condition) => {
  const countryData = await Student.count({
    where: { country: { [Op.ne]: "US" }, ...condition },
    attributes: [
      [sequelize.fn("COUNT", sequelize.col("country")), "count"],
      "country",
      "postal_code",
    ],
    group: ["country", "postal_code"],
  });

  const totalStudents = await Student.count({
    where: { country: { [Op.ne]: "US" }, ...condition },
  });

  const internationalChartData = countryData.map((data) => {
    return {
      name: data.country,
      code: data.postal_code,
      count: data.count,
      percentage: parseFloat(((data.count / totalStudents) * 100).toFixed(2)),
    };
  });

  return internationalChartData;
};

const getStudentCountryChartData = async (condition) => {
  const USStudentData = await getUSStudentData(condition);
  const internationalData = await getInternationalData(condition);

  return { USStudentData, internationalData };
};

const countryDemographicsController = async (req, res) => {
  try {
    const { loggedInUser } = req;

    const condition = {};

    if (
      (loggedInUser.role === ADMIN && loggedInUser?.campusId) ||
      loggedInUser.role === CAMPUS_ADMIN ||
      (loggedInUser.role === SUPER_ADMIN && loggedInUser?.campusId)
    ) {
      condition.campus_id = loggedInUser.campusId;
    } else if (loggedInUser.role === ADMIN && !loggedInUser?.campusId) {
      const campuses = await Campus.findAll({
        attributes: ["id"],
        where: { university_id: loggedInUser.universityId },
      });
      condition.campus_id = { [Op.in]: campuses.map((campus) => campus.id) };
    }
    const studentsCount = await getUsBasedAndInternalStudentCount(condition);

    const countryChartData = await getStudentCountryChartData(condition);

    const data = {
      studentsCount,
      countryChartData,
    };

    return res.status(200).json({
      success: true,
      message: "Country demographics fetched successfully.",
      data,
    });
  } catch (error) {
    logger.error(
      "An error occurred while fetching country demographics : %s",
      error.message,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while fetching country demographics. Please try again later.",
    });
  }
};

/* -------------------------------------------------------------------------- */
module.exports = {
  getAllStudentsController,
  getStudentByIdController,
  getDemographicsController,
  getAttendanceController,
  getRiskedStudentsController,
  getDraftMessagesController,
  saveDraftMessageController,
  sendRiskMailController,
  addStudentUnderCareListController,
  undoCarelistedStudentController,
  showCarelistController,
  countryDemographicsController,
};
