// routes/changemembership/index.js

const express = require('express');
const router = express.Router();
const changeMembershipController = require('../../controllers/changemembershipController');
const ensureAuthenticated = require('../../middleware/ensureAuthenticated');

// Show membership change interface
router.get('/', ensureAuthenticated, changeMembershipController.showChangeMembershipForm);

// Handle membership cancellation
router.post('/cancel', ensureAuthenticated, changeMembershipController.cancelMembership);

// Redirect here after successful membership updates
router.get('/success', ensureAuthenticated, changeMembershipController.changeSuccess);

module.exports = router;