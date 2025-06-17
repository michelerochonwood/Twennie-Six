const express = require('express');
const router = express.Router();
const { renderMemberDashboard } = require('../../controllers/memberdashboardController');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session?.user) {
        console.log(`User authenticated: ${req.session.user.username}`);
        return next();
    }
    console.warn('Access denied. Redirecting to login.');
    return res.redirect('/auth/login');
};

// ✅ Route to render member dashboard (no session-based tracking)
router.get('/', isAuthenticated, async (req, res, next) => {
    try {
        console.log("Rendering member dashboard...");
        console.log("Session at start of /dashboard/member route:", req.session);

        // ✅ Directly fetch and render the member dashboard (no session reloading needed)
        await renderMemberDashboard(req, res);

        console.log("Member dashboard rendered successfully.");
        
    } catch (err) {
        console.error("❌ Error in member dashboard route:", err.message);
        next(err);
    }
});

module.exports = router;






