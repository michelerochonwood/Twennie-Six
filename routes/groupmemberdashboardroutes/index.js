const express = require('express');
const router = express.Router();
const groupMemberDashboardController = require('../../controllers/groupmemberdashboardController');


// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session?.user) {
        console.log(`User authenticated: ${req.session.user.username}`);
        return next();
    }
    console.warn('Access denied. Redirecting to login.');
    return res.redirect('/auth/login');
};

// Route to render group member dashboard and store the current prompt in session
router.get('/', isAuthenticated, async (req, res, next) => {
    try {
        const dashboardData = await groupMemberDashboardController.renderGroupMemberDashboard(req, res);

        // Store the current prompt data in the session
        if (dashboardData?.groupmemberPromptA) {
            req.session.groupmemberPromptA = {
                promptSetId: dashboardData.groupmemberPromptA.promptSetId?.toString(),
                promptIndex: Number(dashboardData.groupmemberPromptA.promptIndex)
            };
        }
        if (dashboardData?.groupmemberPromptB) {
            req.session.groupmemberPromptB = {
                promptSetId: dashboardData.groupmemberPromptB.promptSetId?.toString(),
                promptIndex: Number(dashboardData.groupmemberPromptB.promptIndex)
            };
        }
        if (dashboardData?.groupmemberPromptC) {
            req.session.groupmemberPromptC = {
                promptSetId: dashboardData.groupmemberPromptC.promptSetId?.toString(),
                promptIndex: Number(dashboardData.groupmemberPromptC.promptIndex)
            };
        }

        console.log("Session after setting prompt data:", req.session);

    } catch (err) {
        console.error('Error in group member dashboard route:', err.message);
        next(err); // Pass the error to the general error handler
    }
});

module.exports = router;


