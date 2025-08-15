const router = require('express').Router();

function readUiCookie(req) {
  try { return req.cookies.tw_ui ? JSON.parse(req.cookies.tw_ui) : {}; }
  catch { return {}; }
}

router.get('/preferences', (req, res) => {
  const csrfToken = req.csrfToken ? req.csrfToken() : null;
  const ui = readUiCookie(req);
  res.render('preference_views/ui', {
    layout: 'mainlayout',
    title: 'Site Preferences',
    csrfToken,
    uiPrefsFromCookie: ui
  });
});

router.post('/preferences', (req, res) => {
  // No theme here
  const ui = {
    tab: req.body.defaultDashboardTab || 'membership',
    reducedMotion: !!req.body.reducedMotion,
    density: req.body.contentDensity || 'comfortable'
  };

  try {
    const consent = req.cookies.twennieConsent ? JSON.parse(req.cookies.twennieConsent) : {};
    if (consent.functional) {
      res.cookie('tw_ui', JSON.stringify(ui), {
        maxAge: 1000 * 60 * 60 * 24 * 180,
        sameSite: 'Lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false,
        domain: process.env.COOKIE_DOMAIN || undefined,
        path: '/'
      });
    }
  } catch {}

  res.redirect(req.get('referer') || '/');
});

module.exports = router;


