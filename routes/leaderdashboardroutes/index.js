const express = require('express');
const router = express.Router();
const leaderDashboardController = require('../../controllers/leaderdashboardController');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session?.user) {
        console.log(`User authenticated: ${req.session.user.username}`);
        return next();
    }
    console.warn('Access denied. Redirecting to login.');
    return res.redirect('/auth/login');
};

// Route to render leader dashboard and store the current prompt in session
router.get('/', isAuthenticated, async (req, res, next) => {
    try {
        const dashboardData = await leaderDashboardController.renderLeaderDashboard(req, res);

        if (dashboardData?.leaderPrompt1) {
            req.session.leaderPrompt1 = {
                promptSetId: dashboardData.leaderPrompt1.promptSetId?.toString(),
                promptIndex: Number(dashboardData.leaderPrompt1.promptIndex)
            };

            console.log("Session after setting leader prompt data:", req.session);
        } else {
            console.warn("No leader prompt data available to store in session.");
        }

    } catch (err) {
        console.error('Error in leader dashboard route:', err.message);
        next(err); // Pass the error to the general error handler
    }
});

module.exports = router;
