const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());

// Define the User schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }, // Add role field
});

// Create the User model
const User = mongoose.model('User', userSchema);

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    console.log('Incoming registration request:', { username, password });

    if (!username || !password) {
        console.log('Missing username or password');
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const existingUser = await User.findOne({ username });
        console.log('Existing user check:', existingUser);

        if (existingUser) {
            console.log('User already exists');
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Hashed password:', hashedPassword);

        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        console.log('New user saved:', newUser);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = User;