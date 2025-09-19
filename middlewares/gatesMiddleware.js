const {
  ROLES_MAPPING: { SUPER_ADMIN, ADMIN, CAMPUS_ADMIN, CAMPUS_MANAGER },
} = require("../config/constants");

const isSuperAdmin = (req, res, next) => {
  const { loggedInUser } = req;
  if (
    loggedInUser.role !== SUPER_ADMIN ||
    (loggedInUser.role === SUPER_ADMIN && loggedInUser?.campusId)
  ) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized for this request.",
    });
  }

  next();
};

const isSuperAdminOrAdmin = (req, res, next) => {
  const { loggedInUser } = req;
  if (
    !(
      loggedInUser.role === ADMIN ||
      (loggedInUser.role === SUPER_ADMIN && loggedInUser?.campusId)
    )
  ) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized for processing this request.",
    });
  }

  next();
};

const haveAllAccess = (req, res, next) => {
  const { loggedInUser } = req;

  if (
    loggedInUser.role !== ADMIN &&
    loggedInUser.role !== CAMPUS_ADMIN &&
    !(loggedInUser.role === SUPER_ADMIN && loggedInUser?.campusId)
  ) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized for processing this request.",
    });
  }
  next();
};

const notForManager = (req, res, next) => {
  const { loggedInUser } = req;

  if (loggedInUser.role === CAMPUS_MANAGER) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized for processing this request.",
    });
  }

  next();
};

const isAdmin = (req, res, next) => {
  const { loggedInUser } = req;

  if (loggedInUser.role !== ADMIN) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized for processing this request.",
    });
  }

  next();
};

const notSuperAdmin = (req, res, next) => {
  const { loggedInUser } = req;

  if (
    loggedInUser.role === SUPER_ADMIN &&
    !(loggedInUser.role === SUPER_ADMIN && loggedInUser?.campusId)
  ) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized for processing this request.",
    });
  }

  next();
};

module.exports = {
  isSuperAdmin,
  isSuperAdminOrAdmin,
  haveAllAccess,
  notForManager,
  isAdmin,
  notSuperAdmin,
};
