const express = require('express');
const path = require('path');
const { create } = require('express-handlebars');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const moment = require('moment');
const passport = require('passport');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const csrf = require('csurf');
const MemberProfile = require('./models/profile_models/member_profile');
const LeaderProfile = require('./models/profile_models/leader_profile');
const GroupMemberProfile = require('./models/profile_models/groupmember_profile');


dotenv.config();

const app = express();

// ✅ Trust proxy for secure cookies on Railway
app.set('trust proxy', 1);

console.log("✅ MONGO_URI in use:", process.env.MONGO_URI);

// ✅ Handlebars setup
const hbs = create({
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  defaultLayout: 'mainlayout',
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
  },
helpers: {
  replace: (string, find, replace) =>
    typeof string === 'string' ? string.split(find).join(replace) : '',

  formatContent: (content) =>
    content ? content.replace(/\n/g, '<br>') : '',

  ifEquals: (a, b, options) =>
    a === b ? options.fn(this) : options.inverse(this),

  toLowerCase: (str) =>
    typeof str === 'string' ? str.toLowerCase() : '',

  formatDate: (date) =>
    date ? moment(date).format('MMMM D, YYYY') : '',

  eq: (v1, v2) => v1 === v2,

  ne: (v1, v2) => v1 !== v2,

  and: (v1, v2) => v1 && v2,

  or: (v1, v2) => v1 || v2,

  includes: (array, value) =>
    Array.isArray(array) && array.includes(value),

  ifIncludes: (array, value, options) =>
    Array.isArray(array) && array.includes(value)
      ? options.fn(this)
      : options.inverse(this),

  range: (start, end) =>
    Array.from({ length: end - start }, (_, i) => start + i),

  concat: (str1, str2) =>
    `${str1}${str2}`,

  lt: (a, b) => a < b,

  equal: (a, b) => a === b, // ✅ Add this safely

  getUnitTypeIcon: (unitType) => {
    const icons = {
      article: '/icons/article.svg',
      video: '/icons/video.svg',
      interview: '/icons/interview.svg',
      promptset: '/icons/promptset.svg',
      exercise: '/icons/exercise.svg',
      template: '/icons/template.svg',
    };
    return icons[unitType] || '/icons/default.svg';
  },

getDurationImage: (unitType) => {
  const baseURL = 'https://www.twennie.com/images/';
  const map = {
    article: '5mins.svg',
    video: '10mins.svg',
    interview: '10mins.svg',
    promptset: '20mins.svg',
    exercise: '30mins.svg',
    template: '30mins.svg',
  };
  if (!map[unitType]) {
    console.warn(`⚠️ Unrecognized unitType for duration image: ${unitType}`);
  }
  return baseURL + (map[unitType] || '5mins.svg');
},


  capitalize: (str) =>
    typeof str === 'string' ? str.charAt(0).toUpperCase() + str.slice(1) : '',

  json: (context) =>
    JSON.stringify(context, null, 2),

  increment: (value) =>
    parseInt(value) + 1,

  timestamp: () => Date.now(),

  getYouTubeEmbedUrl: (url) => {
    if (!url) return '';
    if (url.includes('watch?v=')) {
      const videoId = url.split('watch?v=')[1].split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  }
}

  
});

hbs.getPartials().then((partials) => {
  console.log('Registered Partials:', Object.keys(partials));
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ✅ Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'defaultsecret',
    resave: true,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions',
      ttl: 7 * 24 * 60 * 60,
      autoRemove: 'interval',
      autoRemoveInterval: 10
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);

app.use('/badges', require('./routes/badgesroutes'));

// ✅ CSRF setup (after sessions)


const csrfProtection = csrf();

app.use((req, res, next) => {
  const skipPaths = ['/member/group/verify-registration-code'];

  if (
    req.method === 'POST' &&
    skipPaths.includes(req.path)
  ) {
    return next(); // ✅ Skip CSRF ONLY for this route
  }

  const contentType = req.headers['content-type'] || '';
  if (contentType.startsWith('multipart/form-data')) {
    return next(); // ✅ Still skip file uploads
  }

  csrfProtection(req, res, next); // ✅ CSRF for everything else
});






// ✅ Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - User: ${req.session?.user?.username || 'Guest'}`);
  next();
});

// ✅ Passport setup
require('./config/passport-config')(passport);
app.use(passport.initialize());
app.use(passport.session());

app.use('/stripe', require('./routes/stripe/stripewebhook'));


// ✅ Global user session middleware
const Member = require("./models/member_models/member");
const Leader = require("./models/member_models/leader");
const GroupMember = require("./models/member_models/group_member");

app.use(async (req, res, next) => {
  if (req.session?.user?.id) {
    try {
      let membershipType = req.session.user.membershipType;
      const member = await Member.findById(req.session.user.id);
      const leader = await Leader.findById(req.session.user.id);
      const groupMember = await GroupMember.findById(req.session.user.id);

      if (member) membershipType = "member";
      else if (leader) membershipType = "leader";
      else if (groupMember) membershipType = "groupmember";

      req.session.user.membershipType = membershipType;
      res.locals.dashboardLink = `/dashboard/${membershipType}`;
      console.log(`✅ dashboardLink set: ${res.locals.dashboardLink}`);
    } catch (err) {
      console.error("❌ Error retrieving membershipType:", err);
      res.locals.dashboardLink = "/dashboard";
    }
  } else {
    res.locals.dashboardLink = "/dashboard";
  }
res.locals.user = req.user || null;
res.locals.isAuthenticated = req.isAuthenticated();
res.locals.userProfileImage = '/images/default-avatar.png'; // fallback

try {
  if (req.session?.user?.id) {
    const { id, membershipType } = req.session.user;

    if (membershipType === 'member') {
      const profile = await MemberProfile.findOne({ memberId: id }).lean();
      if (profile?.profileImage) res.locals.userProfileImage = profile.profileImage;
    } else if (membershipType === 'leader') {
      const profile = await LeaderProfile.findOne({ leaderId: id }).lean();
      if (profile?.profileImage) res.locals.userProfileImage = profile.profileImage;
    } else if (membershipType === 'groupmember') {
      const profile = await GroupMemberProfile.findOne({ groupMemberId: id }).lean();
      if (profile?.profileImage) res.locals.userProfileImage = profile.profileImage;
    }
  }
} catch (err) {
  console.error('❌ Error loading profile image:', err);
}

next();
});

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// ✅ Ensure directories exist
['public/uploads/profiles', 'public/uploads/groups'].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});


// ✅ Routes
app.use('/', require('./routes/promoroutes/promoroutes'));
app.use('/member', require('./routes/memberroutes'));
app.use('/member/group', require('./routes/groupmemberroutes'));
app.use('/dashboard/leader', require('./routes/leaderdashboardroutes'));
app.use('/dashboard/groupmember', require('./routes/groupmemberdashboardroutes'));
app.use('/dashboard/member', require('./routes/memberdashboardroutes'));
app.use('/leader', require('./routes/leaderroutes'));
app.use('/auth', require('./routes/loginroutes'));
app.use('/profile', require('./routes/profileroutes'));
app.use('/topics', require('./routes/topicroutes'));
app.use('/unitform', require('./routes/unitformroutes'));
app.use('/unitviews', require('./routes/unitviewroutes'));
app.use('/bytopic', require('./routes/bytopicroutes'));
app.use('/tags', require('./routes/tagroutes'));
app.use('/promptsetregistration', require('./routes/promptsetregistrationroutes'));
app.use('/promptsetassign', require('./routes/promptsetassignroutes'));
app.use('/promptsetnotes', require('./routes/promptsetnotesroutes'));
app.use('/promptsetcomplete', require('./routes/promptsetcompleteroutes'));
app.use('/membertopics', require('./routes/membertopicroutes'));

app.use('/notes', require('./routes/notesroutes'));
app.use('/reports', require('./routes/reportingroutes'));
app.use('/latest', require('./routes/latestroutes'));
app.use('/promptsetstart', require('./routes/promptsetstartroutes'));
app.use('/change_membership', require('./routes/changemembershiproutes'));

// ✅ CSRF Error handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    console.error('❌ CSRF token validation failed.');
    console.error('Request body at failure:', JSON.stringify(req.body, null, 2));
    console.error('Session at failure:', JSON.stringify(req.session, null, 2));
    return res.status(403).render('member_form_views/error', {
      layout: 'memberformlayout',
      title: 'CSRF Error',
      errorMessage: 'Form submission failed for security reasons. Please refresh the page and try again.',
    });
  }
  next(err);
});


// ✅ 404 handler
app.use((req, res) => {
  console.warn(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).render('member_form_views/error', {
    layout: 'memberformlayout',
    title: 'Page Not Found',
    errorMessage: 'The page you are looking for does not exist.',
  });
});

// ✅ General error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  const layout = req.originalUrl.startsWith('/member') ? 'memberformlayout' : 'mainlayout';
  res.status(500).render('member_form_views/error', {
    layout,
    title: 'Server Error',
    errorMessage: process.env.NODE_ENV === 'development' ? err.message : 'An internal server error occurred.',
  });
});

module.exports = app;





