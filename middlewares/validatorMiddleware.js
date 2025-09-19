const { validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const { errors: errorsList } = errors;

    if (errorsList.length) {
      return res
        .status(400)
        .json({ success: false, message: errorsList[0].msg });
    }
  }

  next();
};

module.exports = validate;
