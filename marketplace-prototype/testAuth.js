import { signUp, logIn } from "./auth.js";

// Test user credentials
const testEmail = "testuser@example.com";
const testPassword = "password123";

// Test sign-up
async function testSignUp() {
    await signUp(testEmail, testPassword);
}

// Test login
async function testLogIn() {
    await logIn(testEmail, testPassword);
}

// Run tests
testSignUp().then(() => testLogIn());