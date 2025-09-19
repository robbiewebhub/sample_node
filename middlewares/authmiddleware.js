const jwt = require("jsonwebtoken");
const {
  ROLES_MAPPING: { SUPER_ADMIN, ADMIN },
} = require("../config/constants");
const { Campus, University } = require("../models");
const { logger } = require("../utils/loggerUtils");

module.exports = async (req, res, next) => {
  try {
    const token = req.headers["token"];

    if (!token) {
      res.status(403).json({ success: false, message: "No token provided" });
      return;
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        res.status(403).json({
          success: false,
          message: "Failed to authenticate token",
          auth: false,
        });
        return;
      }
      req.loggedInUser = decoded;

      if (
        !(req.loggedInUser.role === SUPER_ADMIN && !req.loggedInUser?.campusId) // check is super admin
      ) {
        if (!(req.loggedInUser.role === ADMIN) && !req.loggedInUser?.campusId) {
          const existedCampus = await Campus.findOne({
            where: { id: req.loggedInUser.campusId },
          });

          if (!existedCampus) {
            res.status(400).json({
              success: false,
              message: "Unable to identify campus.",
              auth: false,
            });
            return;
          }

          if (!existedCampus.is_activate) {
            res.status(400).json({
              success: false,
              message: "campus status is inactive.",
              auth: false,
            });
            return;
          }
        }

        const existedUniversity = await University.findOne({
          where: { id: req.loggedInUser.universityId },
        });

        if (!existedUniversity) {
          return res.status(400).json({
            success: false,
            message: "Unable to identify university.",
            auth: false,
          });
        }

        if (!existedUniversity.is_activated) {
          res.status(400).json({
            success: false,
            message: "university status is inactive.",
            auth: false,
          });
          return;
        }
      }
      next();
    });
  } catch (error) {
    logger.error("Error occured: %s", error.message, { stack: error.stack });
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};
