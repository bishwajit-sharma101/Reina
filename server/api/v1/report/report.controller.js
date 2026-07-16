const asyncHandler = require("express-async-handler");
const Report = require("./report.model");

const createReport = asyncHandler(async (req, res) => {
    const { reportedUserId, reason, details } = req.body;

    if (!reportedUserId || !reason) {
        res.status(400);
        throw new Error("Missing required fields");
    }

    const report = await Report.create({
        reporter: req.user._id,
        reportedUser: reportedUserId,
        reason,
        details
    });

    res.status(201).json({ success: true, message: "Report submitted", report });
});

module.exports = { createReport };