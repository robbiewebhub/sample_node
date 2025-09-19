const multer = require("multer");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = "./uploads";

    switch (req.originalUrl) {
      case "/api/v1/students/send-risk-mail":
        uploadPath = "./uploads/attachments";
        break;
      default:
        uploadPath = "./uploads";
        break;
    }

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    let uniqueSuffix = "";
    if (req.originalUrl === "/api/v1/model/upload") {
      uniqueSuffix = "trained_model.pkl";
    } else {
      uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    }
    cb(null, file.originalname + "-" + uniqueSuffix);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = upload;
