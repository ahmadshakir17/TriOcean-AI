const passport = require('passport');
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const User = require('../models/User');

// Passport configuration
const configurePassport = (app) => {
  console.log('🔧 Configuring passport...');
  console.log('Client ID:', process.env.MICROSOFT_CLIENT_ID);
  console.log('Client Secret:', process.env.MICROSOFT_CLIENT_SECRET ? '***' : 'NOT FOUND');
  // Session configuration
  app.use(require('express-session')({
    secret: process.env.JWT_SECRET || 'your-super-secret-session-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
  }));

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.user_id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Microsoft OAuth Strategy
  passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID || '63e28fde-5974-4d71-89f8-cd7fc1f4080e',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '34aef0f1-cea2-46ef-9185-032a12c46191',
    callbackURL: "http://localhost:3000/auth/microsoft/callback",
    scope: ['openid', 'profile', 'email', 'User.Read']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let user = await User.findByEmail(profile.emails[0].value);
      
      if (!user) {
        // Create new user if doesn't exist
        const userData = {
          name: profile.displayName,
          email: profile.emails[0].value,
          password: 'microsoft-oauth', // Dummy password for OAuth users
          role: 'staff' // Default role
        };
        
        const userId = await User.create(userData);
        user = await User.findById(userId);
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
};

// Authentication middleware
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/microsoft');
};

const ensureAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Admin access required' });
};

module.exports = {
  configurePassport,
  ensureAuthenticated,
  ensureAdmin
}; 