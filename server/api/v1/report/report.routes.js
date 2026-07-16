const express = require("express");
const router = express.Router();
const { createReport } = require("./report.controller");
const { protect } = require("../../../modules/auth/auth.middleware");

router.post("/", protect, createReport);

module.exports = router;