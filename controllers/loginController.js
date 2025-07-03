
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



handleLogin: (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err) {
      console.error('❌ Auth error:', err);
      return next(err);
    }
    if (!user) {
      console.warn('❌ Invalid login attempt');
      return res.status(401).render('login_views/login_view', {
        layout: 'mainlayout',
        title: 'Login',
        error: 'Invalid email or password.',
      });
    }

    req.login(user, async (err) => {
      if (err) return next(err);

      // Augment session with values needed elsewhere
      const membershipType = user.membershipType || 'leader';
      const username =
        user.username || user.groupLeaderName || user.name || user.groupMemberName || 'User';

      req.session.user = {
        id: user._id,
        username,
        membershipType
      };

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
    });
  })(req, res, next);
},


  handleLogout: (req, res) => {
    req.session.destroy(() => {
      console.log('Logout successful');
      res.redirect('/auth/login');
    });
  },
};


