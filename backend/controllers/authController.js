const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require('dotenv');
const authMiddleware = require('../middleware/auth');

dotenv.config();

// Signup route
const signup = async (req, res) => {
    const { firstName, lastName, phone, role, schoolName, schoolCode, email, password } = req.body;

    if (!firstName || !lastName)  return res.status(400).json({ message: "First name and Last name are required" });

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            role: role,
            schoolName:schoolName,
            schoolCode:schoolCode,
            email:email,
            password: hashedPassword,
        });

        const token = jwt.sign(
            { id: newUser._id, email: newUser.email, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token, user: newUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Login route
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Teacher doesn't exist" });

        const isPassword = await bcrypt.compare(password, user.password);
        if (!isPassword) return res.status(400).json({ message: "Incorrect password" });

        const token = jwt.sign(
            { id: user._id, title: user.title, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { signup, login };
