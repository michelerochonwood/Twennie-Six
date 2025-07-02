const bcrypt = require('bcrypt');
const Member = require('../models/member_models/member');
const Leader = require('../models/member_models/leader');
const GroupMember = require('../models/member_models/groupmember');

module.exports = {
  // Render login view
  showLoginForm: (req, res) => {
    console.log('Login page accessed');
    const csrfToken = req.csrfToken ? req.csrfToken() : null;
    res.render('login_views/login_view', {
      layout: 'mainlayout',
      title: 'Login',
      csrfToken,
    });
  },

  // Unified login for all types
  handleLogin: async (req, res, next) => {
    const email = req.body.email.toLowerCase();
    const password = req.body.password;

    console.log('Login attempt with email:', email);

    try {
      // Try each user type in sequence
      let user =
        await Member.findOne({ email }) ||
        await Leader.findOne({ groupLeaderEmail: email }) ||
        await GroupMember.findOne({ email });

      if (!user) {
        console.warn(`No matching user found for email: ${email}`);
        return res.status(401).render('login_views/login_view', {
          layout: 'mainlayout',
          title: 'Login',
          error: 'Invalid email or password.',
        });
      }

      // Determine login source
      const isLeader = !!user.groupLeaderEmail;
      const isGroupMember = !!user.membershipType && user.membershipType === 'group_member';
      const isMember = !!user.membershipType && user.membershipType === 'member';

      // Check password
      const passwordMatches = await bcrypt.compare(password, user.password);
      if (!passwordMatches) {
        console.warn(`Password mismatch for email: ${email}`);
        return res.status(401).render('login_views/login_view', {
          layout: 'mainlayout',
          title: 'Login',
          error: 'Invalid email or password.',
        });
      }

      // At this point, login is successful
      req.session.user = {
        id: user._id,
        username: user.username || user.groupLeaderName || user.name,
        membershipType: user.membershipType || 'leader', // leader doesn't have membershipType field
      };

      console.log(`Login successful: ${req.session.user.username}`);

      // Redirect based on user type
      if (isLeader) {
        return res.redirect('/dashboard/leader');
      } else if (isGroupMember) {
        return res.redirect('/dashboard/groupmember');
      } else if (isMember) {
        return res.redirect('/dashboard/member');
      } else {
        console.warn('Unrecognized user type — defaulting to /dashboard');
        return res.redirect('/dashboard');
      }

    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).render('login_views/login_view', {
        layout: 'mainlayout',
        title: 'Login',
        error: 'An unexpected error occurred. Please try again.',
      });
    }
  },

  // Logout
  handleLogout: (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err.message);
        return res.status(500).render('login_views/error', {
          layout: 'mainlayout',
          title: 'Error',
          errorMessage: 'An error occurred during logout. Please try again.',
        });
      }

      console.log('Logout successful');
      req.session.destroy(() => {
        res.redirect('/auth/login');
      });
    });
  },
};


