const express = require('express');
const router = express.Router();
const memberController = require('../../controllers/memberController');
const Member = require('../member_models/member'); // Needed for /check-username

// Standard Individual Membership Form (GET + POST)
router.get('/form', memberController.showMemberForm);
router.post('/form', memberController.createMember);

// Free Membership Form (GET)
router.get('/free-form', (req, res) => {
  res.render('member_form_views/free_individual', {
    layout: 'memberformlayout',
    csrfToken: req.csrfToken()
  });
});

// Choose Membership Landing
router.get('/choose', (req, res) => {
  res.render('member_form_views/choose_membership', {
    layout: 'memberformlayout'
  });
});

// Convert Member to Group Leader (GET)
router.get('/convert-to-leader', (req, res) => {
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

// Convert Member to Group Leader (POST)
router.post('/convert-to-leader', memberController.convertToLeader);

// Stripe Payment Success + Cancel
router.get('/payment/success', (req, res) => {
  const username = req.session.user?.username || 'User';
  const membershipType = req.session.user?.membershipType;

  const dashboardLink =
    membershipType === 'leader' ? '/dashboard/leader' : '/dashboard/member';

  res.render('member_form_views/register_success', {
    layout: 'memberformlayout',
    title: 'Registration Successful',
    username,
    dashboardLink
  });
});

router.get('/payment/cancel', (req, res) => {
  res.render('member_form_views/error', {
    layout: 'memberformlayout',
    title: 'Payment Canceled',
    errorMessage: 'Your payment was canceled. You can try again anytime or contact support.'
  });
});

// Registration success for non-paid members
router.get('/register_success', (req, res) => {
  const username = req.session.user?.username || 'User';
  res.render('member_form_views/register_success', {
    layout: 'memberformlayout',
    title: 'Registration Successful',
    username,
    dashboardLink: '/dashboard/member'
  });
});

// Username availability check (AJAX endpoint)
router.get('/check-username', async (req, res) => {
  const { username } = req.query;
  const user = await Member.findOne({ username });
  res.json({ available: !user });
});

module.exports = router;




