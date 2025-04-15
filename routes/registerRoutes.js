// filepath: /Users/dad/entrerexitprofit_1/routes/registerRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Ensure the User model is correctly defined and the path is accurate

// POST /register route
router.post('/', async (req, res) => {
    const { username, password } = req.body;

    console.log('Incoming registration request:', { username, password });

    if (!username || !password) {
        console.log('Missing username or password');
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Password hashed successfully');

        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        console.log('User saved successfully:', newUser);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
});

module.exports = router;