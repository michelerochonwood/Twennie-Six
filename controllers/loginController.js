const bcrypt = require('bcrypt');

const Member = require('../models/member_models/member');
const Leader = require('../models/member_models/leader');
const GroupMember = require('../models/member_models/group_member');
const passport = require('passport');

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
    const email = (req.body.email || '').toLowerCase();
    const password = req.body.password;

    console.log('Login attempt with email:', email);

    try {
      // Try each user type in order
      const user =
        await Member.findOne({ email }) ||
        await Leader.findOne({ groupLeaderEmail: email }) ||
        await GroupMember.findOne({ email });

      if (!user) {
        console.warn(`❌ No user found for ${email}`);
        return res.status(401).render('login_views/login_view', {
          layout: 'mainlayout',
          title: 'Login',
          error: 'Invalid email or password.',
          csrfToken: req.csrfToken ? req.csrfToken() : null,
        });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        console.warn(`❌ Password mismatch for ${email}`);
        return res.status(401).render('login_views/login_view', {
          layout: 'mainlayout',
          title: 'Login',
          error: 'Invalid email or password.',
          csrfToken: req.csrfToken ? req.csrfToken() : null,
        });
      }

      // Normalize role/membership for dashboard routing
      // Leaders have membershipType 'leader' (or detect by groupLeaderEmail)
      // Group members have membershipType 'group_member'
      // Individual members use 'member'
      const membershipType =
        user.membershipType ||
        (user.groupLeaderEmail ? 'leader' : (user.groupId ? 'group_member' : 'member'));

      const username =
        user.username || user.groupLeaderName || user.name || user.groupMemberName || 'User';

      // Where to go after full login (or after MFA success)
      const redirectByType = {
        leader: '/dashboard/leader',
        group_member: '/dashboard/groupmember',
        member: '/dashboard/member',
      };
      const redirectTo = redirectByType[membershipType] || '/';

      // ---- MFA BRANCH ----
      if (user.mfa?.enabled) {
        // Do NOT call req.login yet. Hold a "pending MFA" session and challenge.
        req.session.pendingMfa = {
          userId: user._id.toString(),
          role:
            membershipType === 'leader'
              ? 'leader'
              : membershipType === 'group_member'
              ? 'group_member'
              : 'member',
          // Whatever you usually put in req.session.user after login
          user: {
            id: user._id.toString(),
            username,
            accessLevel:
              membershipType === 'leader'
                ? 'leader'
                : membershipType === 'group_member'
                ? 'group_member'
                : 'member',
          },
          redirectTo,
        };

        console.log(`🔐 Password ok; MFA required for ${username}. Redirecting to challenge.`);
        return res.redirect('/auth/mfa/challenge');
      }

      // ---- NO MFA: regular login path ----
      req.login(user, (err) => {
        if (err) {
          console.error('❌ req.login error:', err);
          return next(err);
        }

        // Keep your existing lightweight session payload for other middleware
        req.session.user = {
          id: user._id,
          username,
          membershipType,
        };

        console.log(`✅ Login successful: ${username} (${membershipType})`);
        return res.redirect(redirectTo);
      });
    } catch (err) {
      console.error('❌ Login error:', err);
      return res.status(500).render('login_views/login_view', {
        layout: 'mainlayout',
        title: 'Login',
        error: 'An unexpected error occurred. Please try again.',
        csrfToken: req.csrfToken ? req.csrfToken() : null,
      });
    }
  },

  handleLogout: (req, res) => {
    req.session.destroy(() => {
      console.log('Logout successful');
      res.redirect('/auth/login');
    });
  }
};



