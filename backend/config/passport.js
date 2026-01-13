const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const crypto = require('crypto');

console.log('🔐 Configuring passport Google OAuth...');

// Debug environment variables
console.log('🔐 Environment Check:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Loaded' : '✗ MISSING');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✓ Loaded' : '✗ MISSING');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');

// Validate environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('❌ FATAL: Google OAuth credentials are missing!');
    console.error('   Make sure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in .env file');
    // Don't throw error during config, but passport will fail if used
}

const callbackURL = process.env.NODE_ENV === 'production'
    ? `${process.env.BACKEND_URL || 'https://dbsl.onrender.com'}/api/user/google/callback`
    : process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/user/google/callback';

console.log(`🔐 Using callback URL: ${callbackURL}`);

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: callbackURL,
            passReqToCallback: true,
            proxy: true
        },
        async (req, accessToken, refreshToken, profile, done) => {
            // ... rest of your strategy code remains the same ...
            try {
                console.log('🔐 Google OAuth Profile:', {
                    id: profile.id,
                    email: profile.emails?.[0]?.value,
                    name: profile.displayName
                });

                let user = await User.findOne({
                    $or: [
                        { googleId: profile.id },
                        { email: profile.emails?.[0]?.value }
                    ]
                });

                if (user) {
                    if (!user.googleId) {
                        user.googleId = profile.id;
                        user.profilePic = profile.photos?.[0]?.value || user.profilePic;
                        await user.save();
                    }
                    console.log(`✅ Existing user found: ${user.email}`);
                    return done(null, user);
                }

                const tempPassword = crypto.randomBytes(32).toString('hex');
                
                user = await User.create({
                    googleId: profile.id,
                    firstName: profile.name?.givenName || '',
                    lastName: profile.name?.familyName || '',
                    email: profile.emails?.[0]?.value || '',
                    profilePic: profile.photos?.[0]?.value || 'default-avatar.png',
                    password: tempPassword,
                    isVerified: true,
                    signupMethod: 'google',
                    needsCompleteProfile: true
                });

                console.log(`✅ Google user created (needs completion): ${user.email}`);
                return done(null, user);

            } catch (error) {
                console.error('🔐 GoogleStrategy error:', error);
                return done(error, null);
            }
        }
    )
);

console.log('✅ Google OAuth strategy configured successfully');

// Serialize/Deserialize
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;