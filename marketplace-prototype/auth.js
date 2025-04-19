// Function to sign up a new user
// This function creates a new user in Firebase Authentication using email and password.
async function signUp(email, password) {
    try {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        console.log("Sign-up successful! User:", userCredential.user);
        alert("Sign-up successful!");
    } catch (error) {
        console.error("Error during sign-up:", error.message);
        alert("Error during sign-up: " + error.message);
    }
}

// Function to log in an existing user
// This function logs in an existing user using email and password.
async function logIn(email, password) {
    try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        console.log("Login successful! User:", userCredential.user);
        alert("Login successful!");
    } catch (error) {
        console.error("Error during login:", error.message);
        alert("Error during login: " + error.message);
    }
}

// Attach event listeners to the sign-up form
// This adds a submit event listener to the sign-up form to handle user registration.
const signUpForm = document.getElementById("signUpForm");
if (signUpForm) {
    signUpForm.addEventListener("submit", async (e) => {
        e.preventDefault(); // Prevent form from refreshing the page
        const email = document.getElementById("signUpEmail").value;
        const password = document.getElementById("signUpPassword").value;
        await signUp(email, password);
    });
}

// Attach event listeners to the login form
// This adds a submit event listener to the login form to handle user login.
const logInForm = document.getElementById("logInForm");
if (logInForm) {
    logInForm.addEventListener("submit", async (e) => {
        e.preventDefault(); // Prevent form from refreshing the page
        const email = document.getElementById("logInEmail").value;
        const password = document.getElementById("logInPassword").value;
        await logIn(email, password);
    });
}
