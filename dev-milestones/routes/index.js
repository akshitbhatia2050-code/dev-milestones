const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');

// Signup route
router.post('/signup', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        });
        await user.save();
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error signing up');
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(401).send('Invalid email or password');
        }
        const isMatch = await bcrypt.compare(req.body.password, user.password);
        if (!isMatch) {
            return res.status(401).send('Invalid email or password');
        }
        // Set session or authentication token here
        res.redirect('/'); // Redirect to the main application page
    } catch (err) {
        console.error(err);
        res.status(500).send('Error logging in');
    }
});

module.exports = router;
