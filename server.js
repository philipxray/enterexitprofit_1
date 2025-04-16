// filepath: /Users/dad/entrerexitprofit_1/server.js
const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const User = require('./models/User'); // Import the User model
const userRoutes = require('./routes/userRoutes'); // Adjust the path if needed
const registerRoutes = require('./routes/registerRoutes'); // Adjust the path if needed

console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('MONGO_URI:', process.env.MONGO_URI);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Failed to connect to MongoDB:', err));

// Simulate token blacklisting without Redis
const blacklistToken = async (token, expirationTime) => {
    console.log('Blacklisting token:', token);
    // No actual blacklisting since Redis is disabled
};

const isTokenBlacklisted = async (token) => {
    console.log('Checking if token is blacklisted:', token);
    return false; // Always return false since Redis is disabled
};

const app = express();

// Apply middleware
app.use(express.json());
app.use(helmet());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
}));

// Define routes
app.use('/register', registerRoutes);
app.use('/', userRoutes);

// Root route
app.get('/', (req, res) => {
    res.send('Backend server is running!');
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const token = jwt.sign(
            { username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Middleware to authenticate token
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('Authorization header:', authHeader);
    console.log('Extracted token:', token);

    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    if (await isTokenBlacklisted(token)) {
        console.log('Token is blacklisted');
        return res.status(403).json({ message: 'Token is blacklisted' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log('Invalid token:', err.message);
            return res.status(403).json({ message: 'Invalid token' });
        }

        console.log('Token verified successfully:', user);
        req.user = user;
        next();
    });
};

// Middleware to authorize roles
const authorizeRole = (requiredRole) => {
    return (req, res, next) => {
        if (req.user.role !== requiredRole) {
            return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};

// Protected route
app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'Access granted to protected route' });
});

// Admin route
app.get('/admin', authenticateToken, authorizeRole('admin'), (req, res) => {
    res.status(200).json({ message: 'Welcome, Admin!' });
});

// Profile route to get user details
app.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.user.username }).select('-password'); // Exclude the password
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Profile route to update user details
app.put('/profile', authenticateToken, async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username: req.user.username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update username if provided
        if (username) {
            user.username = username;
        }

        // Update password if provided
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        await user.save();
        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Logout route
app.post('/logout', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(400).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const expirationTime = decoded.exp - Math.floor(Date.now() / 1000);
        await blacklistToken(token, expirationTime);

        res.status(200).json({ message: 'Logout successful' });
    } catch (err) {
        console.error('Error during logout:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Export the app for testing
module.exports = { app };

// Start the server only if this file is run directly
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}
