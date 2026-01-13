const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User'); // adjust path
const jwt = require('jsonwebtoken');
const { newTeacherActivity } = require('../controllers/activityController');

// Configure nodemailer for Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});


// In your signup function in authController.js
// Replace the email sending section with better error handling:

const signup = async (req, res) => {
  const { firstName, lastName, phone, role, schoolName, schoolCode, email, password } = req.body;

  if (!firstName || !lastName) 
    return res.status(400).json({ message: "First name and Last name are required" });
  if (!password) 
    return res.status(400).json({ message: "Password is required" });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) 
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const newUser = await User.create({
      firstName,
      lastName,
      phone,
      role,
      schoolName,
      schoolCode,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationToken,
      verificationExpires
    });

    // ✅ ADD ACTIVITY TRACKING HERE - After user creation
    try {
      await newTeacherActivity({
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        schoolCode: newUser.schoolCode
      });
      console.log('✅ Teacher registration activity logged');
    } catch (activityError) {
      console.error('❌ Failed to log teacher activity:', activityError);
      // Don't fail the signup if activity logging fails
    }

    // ✅ ADD: Try to send verification email
    try {
      // Build verification URL
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;    
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Verify Your Email Address',
        html: `
          <h2>Welcome to DBSL!</h2>
          <p>Please click the link below to verify your email address:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px;">
            Verify Email
          </a>
          <p>This link will expire in 24 hours.</p>
          <p><small>If the button doesn't work, copy and paste this URL:</small></p>
          <p><small>${verificationUrl}</small></p>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to ${email}`);
      
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      // Don't fail the signup - allow resend later
    }

    // ✅ FIX: Return proper response with verification instructions
    res.status(201).json({ 
      success: true,
      message: "Account created successfully! Please check your email to verify your account.",
      needsVerification: true,
      user: { 
        _id: newUser._id, 
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        isVerified: newUser.isVerified
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ 
      success: false,
      message: "Internal server error during signup" 
    });
  }
};

// Email verification endpoint
const verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.query;

    const user = await User.findOne({
      email,
      verificationToken: token,
      verificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    // Generate JWT after verification
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Email verified successfully!",
      token: jwtToken,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      }
    });
    console.log("Incoming verify request:", req.query);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const resendVerify = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // 1. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // 2. If already verified
    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // 3. Generate new token if missing/expired
    if (!user.verificationToken || user.verificationExpires < Date.now()) {
      user.verificationToken = crypto.randomBytes(32).toString("hex");
      user.verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hrs
      await user.save();
    }

    // 4. Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${user.verificationToken}&email=${encodeURIComponent(user.email)}`;

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: user.email,
      subject: "Verify Your Email Address",
      html: `
        <h2>Welcome to DBSL!</h2>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px;">
          Verify Email
        </a>
        <p>This link will expire in 24 hours.</p>
      `,
    });

    res.json({ message: "Verification email resent. Please check your inbox." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// ✅ NEW: Complete Google signup with additional info
const completeGoogleSignup = async (req, res) => {
  try {
    const { token, schoolName, schoolCode, role, phone } = req.body;

    if (!token || !schoolName || !schoolCode) {
      return res.status(400).json({ 
        message: "School information is required" 
      });
    }

    // Verify the temporary token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ 
        message: "Invalid or expired token. Please try signing up again." 
      });
    }

    if (!decoded.isGoogleSignup) {
      return res.status(400).json({ 
        message: "Invalid signup token" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: decoded.email },
        { googleId: decoded.googleId }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: "User already exists. Please login instead." 
      });
    }

    // Create new user with Google info + additional info
    const newUser = await User.create({
      googleId: decoded.googleId,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      profilePic: decoded.profilePic,
      schoolName,
      schoolCode,
      role: role || 'Teacher',
      phone: phone || '',
      password: crypto.randomBytes(32).toString('hex'), // Random password (won't be used)
      isVerified: true, // Auto-verify Google users
    });

    // Log activity
    try {
      await newTeacherActivity({
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        schoolCode: newUser.schoolCode
      });
      console.log('✅ Google user registration activity logged');
    } catch (activityError) {
      console.error('❌ Failed to log activity:', activityError);
    }

    // Generate full JWT token
    const jwtToken = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: "Google signup completed successfully!",
      token: jwtToken,
      user: {
        _id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        schoolName: newUser.schoolName,
        schoolCode: newUser.schoolCode,
        role: newUser.role,
        profilePic: newUser.profilePic,
      }
    });

  } catch (error) {
    console.error('❌ Complete Google signup error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const completeGoogleProfile = async (req, res) => {
    try {
        const { token, schoolName, schoolCode, role, phone } = req.body;

        if (!token || !schoolName || !schoolCode) {
            return res.status(400).json({ 
                message: "Token and school information are required" 
            });
        }

        // Verify the token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(400).json({ 
                message: "Invalid or expired token. Please try signing up again." 
            });
        }

        if (!decoded.needsProfile) {
            return res.status(400).json({ 
                message: "Invalid profile completion token" 
            });
        }

        // Find and update user
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(400).json({ 
                message: "User not found" 
            });
        }

        // Update user with complete info
        user.schoolName = schoolName;
        user.schoolCode = schoolCode;
        user.role = role || 'Teacher';
        user.phone = phone || '';
        user.needsCompleteProfile = false;
        
        await user.save();

        // Generate full JWT token
        const newToken = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Log activity if needed
        if (user.role === 'Teacher') {
            try {
                await newTeacherActivity({
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    schoolCode: user.schoolCode
                });
                console.log('✅ Google user profile completion activity logged');
            } catch (activityError) {
                console.error('❌ Failed to log activity:', activityError);
            }
        }

        res.json({
            message: "Profile completed successfully!",
            token: newToken,
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                schoolName: user.schoolName,
                schoolCode: user.schoolCode,
                role: user.role,
                profilePic: user.profilePic,
            }
        });

    } catch (error) {
        console.error('❌ Complete Google profile error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Login route
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: "Please verify your email before logging in",
        needsVerification: true 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ IMPORTANT: Return complete user object with profilePic
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      schoolName: user.schoolName,
      schoolCode: user.schoolCode,
      phone: user.phone,
      profilePic: user.profilePic, // ✅ Make sure this is included
      signupMethod: user.signupMethod,
      isVerified: user.isVerified,
      assignedClasses: user.assignedClasses,
      documentsCreated: user.documentsCreated
    };

    console.log('✅ Login successful for:', user.email);
    console.log('📸 Profile pic value:', user.profilePic);
    console.log('🔐 Signup method:', user.signupMethod);

    res.json({
      message: "Login successful",
      token,
      user: userResponse
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

module.exports = { signup, login, verifyEmail, resendVerify, completeGoogleSignup, completeGoogleProfile  };
