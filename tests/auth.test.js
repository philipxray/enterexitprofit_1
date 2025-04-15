const request = require('supertest');
const mongoose = require('mongoose');
const { app, redisClient } = require('../server'); // Import redisClient from server.js
const http = require('http');

let server;

beforeAll(async () => {
    server = http.createServer(app); // Create an HTTP server
    await new Promise((resolve) => server.listen(resolve)); // Start the server
});

afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
        const collections = await mongoose.connection.db.collections();
        for (let collection of collections) {
            await collection.deleteMany({});
        }
    }
});

afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
    }
    await redisClient.quit(); // Close the Redis connection
    await new Promise((resolve) => server.close(resolve)); // Stop the server
});

describe('POST /register', () => {
    it('should register a new user', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                username: 'testuser',
                password: 'password123',
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe('User registered successfully');
    });

    it('should not register a user with an existing username', async () => {
        await request(app).post('/register').send({
            username: 'testuser',
            password: 'password123',
        });

        const response = await request(app)
            .post('/register')
            .send({
                username: 'testuser',
                password: 'password123',
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('User already exists');
    });
});

describe('POST /login', () => {
    it('should log in a user with valid credentials', async () => {
        // First, register a user
        await request(app).post('/register').send({
            username: 'testuser',
            password: 'password123',
        });

        // Then, log in with the same credentials
        const response = await request(app)
            .post('/login')
            .send({
                username: 'testuser',
                password: 'password123',
            });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('token'); // Ensure a token is returned
        expect(response.body.message).toBe('Login successful');
    });

    it('should not log in a user with invalid credentials', async () => {
        // First, register a user
        await request(app).post('/register').send({
            username: 'testuser',
            password: 'password123',
        });

        // Attempt to log in with an incorrect password
        const response = await request(app)
            .post('/login')
            .send({
                username: 'testuser',
                password: 'wrongpassword',
            });

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe('Invalid username or password');
    });

    it('should not log in a non-existent user', async () => {
        const response = await request(app)
            .post('/login')
            .send({
                username: 'nonexistentuser',
                password: 'password123',
            });

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe('Invalid username or password');
    });
});

describe('GET /protected', () => {
    it('should allow access with a valid token', async () => {
        // First, register and log in a user to get a token
        const registerResponse = await request(app).post('/register').send({
            username: 'testuser',
            password: 'password123',
        });

        const loginResponse = await request(app).post('/login').send({
            username: 'testuser',
            password: 'password123',
        });

        const token = loginResponse.body.token;

        // Access the protected route with the token
        const response = await request(app)
            .get('/protected')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Access granted to protected route');
    });

    it('should deny access without a token', async () => {
        const response = await request(app).get('/protected');

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe('Access denied. No token provided.');
    });

    it('should deny access with an invalid token', async () => {
        const response = await request(app)
            .get('/protected')
            .set('Authorization', 'Bearer invalidtoken');

        expect(response.statusCode).toBe(403);
        expect(response.body.message).toBe('Invalid token');
    });
});

describe('POST /reset-password', () => {
    it('should reset the password for an existing user', async () => {
        // First, register a user
        await request(app).post('/register').send({
            username: 'testuser',
            password: 'password123',
        });

        // Reset the password
        const response = await request(app)
            .post('/reset-password')
            .send({
                username: 'testuser',
                newPassword: 'newpassword123',
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Password reset successful');

        // Log in with the new password
        const loginResponse = await request(app).post('/login').send({
            username: 'testuser',
            password: 'newpassword123',
        });

        expect(loginResponse.statusCode).toBe(200);
        expect(loginResponse.body).toHaveProperty('token');
    });

    it('should return 404 if the user does not exist', async () => {
        const response = await request(app)
            .post('/reset-password')
            .send({
                username: 'nonexistentuser',
                newPassword: 'newpassword123',
            });

        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe('User not found');
    });

    it('should return 400 if username or new password is missing', async () => {
        const response = await request(app)
            .post('/reset-password')
            .send({
                username: 'testuser',
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('Username and new password are required');
    });
});

describe('POST /logout', () => {
    it('should blacklist a valid token', async () => {
        // First, register and log in a user to get a token
        await request(app).post('/register').send({
            username: 'testuser',
            password: 'password123',
        });

        const loginResponse = await request(app).post('/login').send({
            username: 'testuser',
            password: 'password123',
        });

        const token = loginResponse.body.token;

        // Logout with the token
        const response = await request(app)
            .post('/logout')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Logout successful');

        // Try accessing a protected route with the blacklisted token
        const protectedResponse = await request(app)
            .get('/protected')
            .set('Authorization', `Bearer ${token}`);

        expect(protectedResponse.statusCode).toBe(403);
        expect(protectedResponse.body.message).toBe('Token is blacklisted');
    });

    it('should return 400 if no token is provided', async () => {
        const response = await request(app).post('/logout');

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('No token provided');
    });
});

describe('GET /admin', () => {
    it('should allow access to admin users', async () => {
        // Register an admin user
        await request(app).post('/register').send({
            username: 'adminuser',
            password: 'password123',
            role: 'admin',
        });

        // Log in as the admin user
        const loginResponse = await request(app).post('/login').send({
            username: 'adminuser',
            password: 'password123',
        });

        const token = loginResponse.body.token;

        // Access the admin route with the admin token
        const response = await request(app)
            .get('/admin')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Welcome, Admin!');
    });

    it('should deny access to non-admin users', async () => {
        // Register a regular user
        await request(app).post('/register').send({
            username: 'regularuser',
            password: 'password123',
        });

        // Log in as the regular user
        const loginResponse = await request(app).post('/login').send({
            username: 'regularuser',
            password: 'password123',
        });

        const token = loginResponse.body.token;

        // Attempt to access the admin route with the regular user token
        const response = await request(app)
            .get('/admin')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(403);
        expect(response.body.message).toBe('Access denied. Insufficient permissions.');
    });
});