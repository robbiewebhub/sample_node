const { logger } = require("../utils/loggerUtils");
const {
  Recommendation,
  Campus,
  Student,
  Advisor,
  AssignedRecommendation,
} = require("../models");
const { Op, Sequelize } = require("sequelize");
const {
  ROLES_MAPPING: { ADMIN, SUPER_ADMIN },
} = require("../config/constants");

const getAllRecommendationsController = async (req, res) => {
  try {
    const recommendations = await Recommendation.findAll();

    const data = recommendations.map((recommendation) => ({
      id: recommendation.id,
      recommendationName: recommendation.recommendation_name,
    }));

    return res.status(200).json({
      success: true,
      message: "Recommendations Fetched Successfully.",
      data,
    });
  } catch (error) {
    logger.error(
      "An error occured while fetching recommendations. : %s",
      error.message,
      {
        stack: error.stack,
      }
    );
    res.status(500).json({
      success: false,
      message: "An error occured while fetching recommendations.",
    });
  }
};

const getAssignedRecommendationsController = async (req, res) => {
  try {
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

    const assignedRecommendations = await AssignedRecommendation.findAll({
      include: [
        {
          model: Student,
          as: "student",
          where: { ...condition },
        },
        {
          model: Advisor,
          as: "advisor",
        },
      ],
    });

    const data = assignedRecommendations.map((assignedRecommendation) => {
      return {
        studentName: assignedRecommendation.student.name,
        recommendationName: assignedRecommendation.recommendation_name,
        progress: assignedRecommendation.progress_status,
        status: assignedRecommendation.status,
        advisorName: assignedRecommendation.advisor.advisor_name,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Assigned recommendations fetched successfully.",
      data,
    });
  } catch (error) {
    logger.error(
      "An error occured while fetching assigned recommendations. : %s",
      error.message,
      {
        stack: error.stack,
      }
    );
    res.status(500).json({
      success: false,
      message: "An error occured while fetching assigned recommendations.",
    });
  }
};

module.exports = {
  getAllRecommendationsController,
  getAssignedRecommendationsController,
};
