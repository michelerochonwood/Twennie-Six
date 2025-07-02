const bcrypt = require('bcrypt');
const Member = require('../models/member_models/member');
const Leader = require('../models/member_models/leader');
const GroupMember = require('../models/member_models/group_member');

module.exports = {
  showLoginForm: (req, res) => {
    console.log('Login page accessed');
    const csrfToken = req.csrfToken ? req.csrfToken() : null;
    res.render('login_views/login_view', {
      layout: 'mainlayout',
      title: 'Login',
      csrfToken,
    });
  },

  handleLogin: async (req, res, next) => {
    const email = req.body.email.toLowerCase();
    const password = req.body.password;

    console.log('Login attempt with email:', email);

    try {
      // Search all user collections
      const user =
        await Member.findOne({ email }) ||
        await Leader.findOne({ groupLeaderEmail: email }) ||
        await GroupMember.findOne({ email });

      if (!user) {
        console.warn(`No user found for ${email}`);
        return res.status(401).render('login_views/login_view', {
          layout: 'mainlayout',
          title: 'Login',
          error: 'Invalid email or password.',
        });
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        console.warn(`Password mismatch for ${email}`);
        return res.status(401).render('login_views/login_view', {
          layout: 'mainlayout',
          title: 'Login',
          error: 'Invalid email or password.',
        });
      }

      // Determine role and session values
      const membershipType = user.membershipType || 'leader';
      const username =
        user.username || user.groupLeaderName || user.name || user.groupMemberName || 'User';

      const sessionUser = {
        id: user._id,
        username,
        membershipType,
      };

      req.session.user = sessionUser;
      res.locals.user = sessionUser;

      console.log(`✅ Login successful: ${username} (${membershipType})`);

      switch (membershipType) {
        case 'leader':
          return res.redirect('/dashboard/leader');
        case 'group_member':
          return res.redirect('/dashboard/groupmember');
        case 'member':
          return res.redirect('/dashboard/member');
        default:
          return res.redirect('/dashboard');
      }

    } catch (err) {
      console.error('❌ Login error:', err);
      return res.status(500).render('login_views/login_view', {
        layout: 'mainlayout',
        title: 'Login',
        error: 'An unexpected error occurred. Please try again.',
      });
    }
  },

  handleLogout: (req, res) => {
    req.session.destroy(() => {
      console.log('Logout successful');
      res.redirect('/auth/login');
    });
  },
};


