const express = require('express');
const router = express.Router();
const changeMembershipController = require('../../controllers/changemembershipController');
const ensureAuthenticated = require('../../middleware/ensureAuthenticated');

// Show membership change interface
router.get('/', ensureAuthenticated, changeMembershipController.showChangeMembershipForm);

// Handle membership cancellation
router.post('/cancel', ensureAuthenticated, changeMembershipController.cancelMembership);

// Handle membership change to free
router.post('/free', ensureAuthenticated, changeMembershipController.changeToFree);

// Handle membership change to individual
router.post('/individual', ensureAuthenticated, changeMembershipController.changeToIndividual);

// Handle membership change to leader
router.post('/leader', ensureAuthenticated, changeMembershipController.changeToLeader);

// Redirect here after successful membership updates
router.get('/success', ensureAuthenticated, changeMembershipController.changeSuccess);

module.exports = router;
