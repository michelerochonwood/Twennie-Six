const passport = require('passport');




module.exports = {
    // Render the login page
    showLoginForm: (req, res) => {
        console.log('Login page accessed');
        const csrfToken = req.csrfToken ? req.csrfToken() : null;
        res.render('login_views/login_view', {
            layout: 'mainlayout',
            title: 'Login',
            csrfToken,
        });
    },

    // Handle login submission
    handleLogin: (req, res, next) => {
        const email = req.body.email.toLowerCase(); // Normalize email
        console.log('Login attempt with email:', email);

        passport.authenticate('local', (err, user, info) => {
            if (err) {
                console.error('Authentication error:', err.message);
                return next(err);
            }
            if (!user) {
                console.warn(`Login failed: Invalid credentials for email: ${email}`);
                return res.status(401).render('login_views/login_view', {
                    layout: 'mainlayout',
                    title: 'Login',
                    error: info?.message || 'Invalid email or password.',
                });
            }

            req.logIn(user, (err) => {
                if (err) {
                    console.error('Login error:', err.message);
                    return next(err);
                }

                req.session.user = {
                    id: user._id,
                    username: user.username,
                    membershipType: user.membershipType,
                };

                console.log(`Login successful: ${user.username}`);
                
                // Redirect based on user type
                if (user.membershipType === 'leader') {
                    res.redirect('/dashboard/leader');
                } else if (user.membershipType === 'group_member') {
                    res.redirect('/dashboard/groupmember');
                } else if (user.membershipType === 'member') {
                    res.redirect('/dashboard/member');
                } else {
                    console.warn('Unknown membership type, redirecting to default dashboard');
                    res.redirect('/dashboard');
                }
            });
        })(req, res, next);
    },

    // Handle logout
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

