const express = require('express');
const router = express.Router();
const User = require('../models/user'); // Assuming your User model is in src/models/user.js
const bcrypt = require('bcrypt');
const session = require('express-session'); // Assuming session middleware is used here

// Login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).send('Invalid username or password');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).send('Invalid username or password');
        }

        // Set up session or token for authentication
        req.session.userId = user._id; // Example using sessions
        res.status(200).send('Login successful');

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Internal server error');
    }
});

// Register route
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).send('Username already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            password: hashedPassword
        });

        await newUser.save();
        res.status(201).send('User registered successfully');

    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).send('Internal server error');
    }
});

// Logout route (example using sessions)
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Error logging out');
        }
        res.status(200).send('Logout successful');
    });
});

module.exports = router;