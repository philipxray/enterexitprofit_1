// filepath: /Users/dad/entrerexitprofit_1/server.js
const express = require('express');
require('dotenv').config();
console.log('MONGO_URI:', process.env.MONGO_URI);
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI);

console.log('JWT_SECRET:', process.env.JWT_SECRET);

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User'); // Import the User model
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const Redis = require('ioredis');
const redisClient = new Redis();

// Helper function to blacklist a token
const blacklistToken = async (token, expirationTime) => {
    await redisClient.set(token, 'blacklisted', 'EX', expirationTime);
};

// Middleware to check if a token is blacklisted
const isTokenBlacklisted = async (token) => {
    const result = await redisClient.get(token);
    return result === 'blacklisted';
};

const app = express();
app.use(express.json());
app.use(helmet());

// Apply rate limiting to all requests
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);

// Define your routes here
app.get('/', (req, res) => {
    res.send('Backend server is running!');
});

app.post('/register', async (req, res) => {
    const { username, password, role } = req.body;

    console.log('Incoming registration request:', { username, password, role });

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
        const newUser = new User({ username, password: hashedPassword, role });
        await newUser.save();

        console.log('New user saved:', newUser);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    console.log('Incoming login request:', { username, password });

    if (!username || !password) {
        console.log('Missing username or password');
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const user = await User.findOne({ username });
        console.log('User found:', user);

        if (!user) {
            console.log('Invalid username');
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isPasswordValid);

        if (!isPasswordValid) {
            console.log('Invalid password');
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const token = jwt.sign(
            { username: user.username, role: user.role }, // Include role in the payload
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log('Generated token:', token);

        res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/reset-password', async (req, res) => {
    const { username, newPassword } = req.body;

    console.log('Incoming password reset request:', { username, newPassword });

    if (!username || !newPassword) {
        console.log('Missing username or new password');
        return res.status(400).json({ message: 'Username and new password are required' });
    }

    try {
        const user = await User.findOne({ username });
        console.log('User found for password reset:', user);

        if (!user) {
            console.log('User not found');
            return res.status(404).json({ message: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        console.log('Password updated for user:', username);
        res.status(200).json({ message: 'Password reset successful' });
    } catch (err) {
        console.error('Error during password reset:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Check if the token is blacklisted
    if (await isTokenBlacklisted(token)) {
        return res.status(403).json({ message: 'Token is blacklisted' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }

        req.user = user; // user now includes username and role
        next();
    });
};

const authorizeRole = (requiredRole) => {
    return (req, res, next) => {
        if (req.user.role !== requiredRole) {
            return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};

app.get('/protected', authenticateToken, (req, res) => {
    console.log('Accessing /protected route');
    res.status(200).json({ message: 'Access granted to protected route' });
});

app.get('/admin', authenticateToken, authorizeRole('admin'), (req, res) => {
    res.status(200).json({ message: 'Welcome, Admin!' });
});

app.post('/logout', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(400).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const expirationTime = decoded.exp - Math.floor(Date.now() / 1000); // Calculate remaining time
        await blacklistToken(token, expirationTime);

        console.log('Token blacklisted:', token);
        res.status(200).json({ message: 'Logout successful' });
    } catch (err) {
        console.error('Error during logout:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Export the app and redisClient for testing
module.exports = { app, redisClient };

// Start the server only if this file is run directly
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}