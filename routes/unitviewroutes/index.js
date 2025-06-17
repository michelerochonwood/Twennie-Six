// File: routes/unitviewroutes/index.js
const express = require('express');
const router = express.Router();
const unitviewController = require('../../controllers/unitviewController');

// Route to view a single article
router.get('/articles/view/:id', unitviewController.viewArticle);

// Route to view a single video
router.get('/videos/view/:id', unitviewController.viewVideo);

// Route to view a single interview
router.get('/interviews/view/:id', unitviewController.viewInterview);

// Route to view a single prompt set
router.get('/promptsets/view/:id', unitviewController.viewPromptset);

// Route to view a single exercise
router.get('/exercises/view/:id', unitviewController.viewExercise);

router.get('/templates/view/:id', unitviewController.viewTemplate);

router.get('/unitnotessuccess', (req, res) => {
    res.render('unit_views/unitnotessuccess', { layout: 'unitviewlayout' });
});


module.exports = router;


