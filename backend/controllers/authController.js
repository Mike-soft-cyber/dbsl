const express = require('express');
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
      `
    };

    await transporter.sendMail(mailOptions);
    

    res.json({ 
      message: "User created. Please check your email to verify your account.",
      user: { 
        _id: newUser._id, 
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        isVerified: newUser.isVerified
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
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


// Login route
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 3. Require verified email
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: "Email not verified. Please check your inbox or request a new verification link." 
      });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        schoolName: user.schoolName,
        schoolCode: user.schoolCode,
        role: user.role,
        profilePic: user.profilePic || null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { signup, login, verifyEmail, resendVerify };
