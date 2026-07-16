const express = require('express');
const router = express.Router();

// mount message routes
router.use("/messages", require("../../modules/chat/message.routes"));

module.exports = router;
