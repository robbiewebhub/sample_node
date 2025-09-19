const { faker } = require("@faker-js/faker");
const { sequelize, Student } = require("../models"); // Adjust path to models/index.js
const {
  GENDER,
  ETHNICITY,
  ENROLLMENT_STATUS,
  SEMESTER,
  GRADE_LEVEL,
  FINANCING,
} = require("../config/constants"); // Adjust path as needed

// Generate random student data
let emailCounter = 0;

const generateRandomStudent = () => {
  return {
    name: faker.person.fullName(),
    email: `${faker.internet.username()}${emailCounter++}@${faker.internet.domainName()}`,
    date_of_birth: faker.date.birthdate({ min: 18, max: 25, mode: "age" }),
    gender: faker.helpers.arrayElement(Object.keys(GENDER)),
    ethnicity: faker.helpers.arrayElement(Object.keys(ETHNICITY)),
    current_address: faker.location.streetAddress(),
    permanent_address: faker.location.streetAddress(),
    major: faker.helpers.arrayElement([1, 2, 3]),
    campus_id: faker.helpers.arrayElement([
      13, 16, 14, 18, 19, 17, 20, 21, 3, 15, 12,
    ]),
    disciplinary_records: faker.lorem.paragraph(),
    enrollment_status: faker.helpers.arrayElement(
      Object.keys(ENROLLMENT_STATUS)
    ),
    semester: faker.helpers.arrayElement(Object.keys(SEMESTER)),
    grade_level: faker.helpers.arrayElement(Object.keys(GRADE_LEVEL)),
    minor: null,
    gpa: faker.number.float({ min: 0, max: 4, precision: 0.01 }),
    academic_advisor: faker.person.fullName(),
    clubs_organizations: faker.company.name(),
    volunteer_experience: faker.lorem.sentence(),
    emergency_contact: faker.phone.number(),
    phone_number: faker.phone.number(),
    medical_records: faker.lorem.paragraph(),
    assigned_to: null,
    financing: faker.helpers.arrayElement(Object.keys(FINANCING)),
  };
};

// Insert random students
const insertStudents = async (req, res) => {
  try {
    const { count } = req.params;
    for (let i = 0; i < count; i++) {
      const studentData = generateRandomStudent();
      await Student.create(studentData);
      console.log(`Inserted student ${i + 1}`);
    }

    console.log("All students inserted successfully!");

    return res
      .status(201)
      .json({ success: true, message: "Students created successfully." });
  } catch (error) {
    console.error("Error inserting students:", error);
    return res.status(500).json({
      success: false,
      message: "An error occured while inserting students.",
    });
  }
};

// Add 1 student
// insertStudents(1);

module.exports = { insertStudents };
