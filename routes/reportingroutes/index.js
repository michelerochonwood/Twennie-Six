const express = require("express");
const router = express.Router();
const ensureAuthenticated = require("../../middleware/ensureAuthenticated");
const reportingController = require("../../controllers/reportingController");

// Routes for report views
router.get("/memberengagement", ensureAuthenticated, reportingController.getMemberEngagementReport);
router.get("/promptsetscompleted", ensureAuthenticated, reportingController.getPromptSetsCompletedReport);
router.get("/teamengagement", ensureAuthenticated, reportingController.getTeamEngagementReport);
router.get("/unitscompleted", ensureAuthenticated, reportingController.getUnitsCompletedReport);

module.exports = router;
