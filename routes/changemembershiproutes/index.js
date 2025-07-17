const express = require('express');
const router = express.Router();
const changeMembershipController = require('../../controllers/changemembershipController');
const ensureAuthenticated = require('../../middleware/ensureAuthenticated');

// Show membership change interface
router.get('/', ensureAuthenticated, changeMembershipController.showChangeMembershipForm);

// Membership change success confirmation
router.get('/success', ensureAuthenticated, changeMembershipController.changeSuccess);

// Membership cancellations
router.post('/cancel', ensureAuthenticated, changeMembershipController.cancelMembership);

// Change to free individual membership
router.post('/free', ensureAuthenticated, changeMembershipController.changeToFree);

// Change to paid individual membership (with Stripe redirect)
router.post('/individual', ensureAuthenticated, changeMembershipController.changeToIndividual);

// GET: Show leader conversion form
router.get('/leader-form', ensureAuthenticated, (req, res) => {
  res.render('member_form_views/membertoleaderform', {
    layout: 'memberformlayout',
    csrfToken: req.csrfToken(),
    topicList: [
      'Career Development in Technical Services',
      'Soft Skills in Technical Environments',
      'Project Management',
      'Business Development in Technical Services',
      'Finding Projects Before they Become RFPs',
      'Un-Commoditizing Your Services by Delivering What Clients Truly Value',
      'Proposal Management',
      'Proposal Strategy',
      'Storytelling in Technical Marketing',
      'Client Experience',
      'Social Media, Advertising, and Other Mysteries',
      'Emotional Intelligence',
      'The Pareto Principle or 80/20',
      'Diversity and Inclusion in Consulting',
      'People Before Profit',
      'Non-Technical Roles in Technical Environments',
      'Leadership in Technical Services',
      'The Advantage of Failure',
      'Social Entrepreneurship',
      'Employee Experience',
      'Project Management Software',
      'CRM Platforms',
      'Client Feedback Software',
      'Workplace Culture',
      'Mental Health in Consulting Environments',
      'Remote and Hybrid Work',
      'Four Day Work Week',
      'The Power of Play in the Workplace',
      'Team Building in Consulting',
      'AI in Consulting',
      'AI in Project Management',
      'AI in Learning'
    ]
  });
});

// POST: Handle membership change to leader
router.post('/leader', ensureAuthenticated, changeMembershipController.convertToLeader);

module.exports = router;

