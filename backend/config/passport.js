const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const crypto = require('crypto');

console.log('🔐 Configuring passport Google OAuth...');

const callbackURL = process.env.NODE_ENV === 'production'
    ? `${process.env.BACKEND_URL || 'https://dbsl.onrender.com'}/api/user/google/callback`
    : 'http://localhost:5000/api/user/google/callback';

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
            try {
                console.log('🔐 Google OAuth Profile:', {
                    id: profile.id,
                    email: profile.emails?.[0]?.value,
                    name: profile.displayName
                });

                // Check if user exists by googleId or email
                let user = await User.findOne({
                    $or: [
                        { googleId: profile.id },
                        { email: profile.emails?.[0]?.value }
                    ]
                });

                if (user) {
                    // If user exists but doesn't have googleId, update it
                    if (!user.googleId) {
                        user.googleId = profile.id;
                        user.profilePic = profile.photos?.[0]?.value || user.profilePic;
                        await user.save();
                    }
                    console.log(`✅ Existing user found: ${user.email}`);
                    return done(null, user);
                }

                // Create a Google user WITHOUT placeholder values
                // Just the minimal info from Google
                const tempPassword = crypto.randomBytes(32).toString('hex');

                console.log('🔐 Google profile picture URL:', profile.photos?.[0]?.value);
                console.log('🔐 Profile photos array:', profile.photos);
                
                user = await User.create({
    googleId: profile.id,
    firstName: profile.name?.givenName || '',
    lastName: profile.name?.familyName || '',
    email: profile.emails?.[0]?.value || '',
    profilePic: profile.photos?.[0]?.value || 'default-avatar.png',
    password: tempPassword,
    // Leave phone, schoolName, schoolCode undefined
    isVerified: true,
    signupMethod: 'google',
    needsCompleteProfile: true
});

                console.log(`✅ Google user created (needs completion): ${user.email}`);
                console.log(`   School fields: name="${user.schoolName}", code="${user.schoolCode}", phone="${user.phone}"`);
                return done(null, user);

            } catch (error) {
                console.error('🔐 GoogleStrategy error:', error);
                return done(error, null);
            }
        }
    )
);

console.log('✅ Google OAuth strategy configured successfully');

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