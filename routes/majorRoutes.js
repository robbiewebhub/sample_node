const express = require("express");
const router = express.Router();

const { getAllMajorsController } = require("../controllers/majorController");
const authmiddleware = require("../middlewares/authmiddleware");

router.get("/", authmiddleware, getAllMajorsController);

module.exports = router;
