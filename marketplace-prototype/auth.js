// Function to sign up a new user
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
const logInForm = document.getElementById("logInForm");
if (logInForm) {
    logInForm.addEventListener("submit", async (e) => {
        e.preventDefault(); // Prevent form from refreshing the page
        const email = document.getElementById("logInEmail").value;
        const password = document.getElementById("logInPassword").value;
        await logIn(email, password);
    });
}

// Attach event listener for post type selection
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded and parsed");

    const postTypeSelector = document.getElementById("postTypeSelector");
    if (postTypeSelector) {
        console.log("postTypeSelector:", postTypeSelector); // Debugging log

        postTypeSelector.addEventListener("change", (e) => {
            console.log("Post type selected:", e.target.value); // Debugging log
            const postType = e.target.value;
            const postFormContainer = document.getElementById("postFormContainer");

            // Clear any existing form
            postFormContainer.innerHTML = "";

            // Load the corresponding form based on the selected post type
            if (postType === "eep") {
                postFormContainer.innerHTML = `
                    <h3>Create an EEP (Entry and Exit Points)</h3>
                    <form id="eepForm">
                        <input type="text" id="eepTicker" placeholder="Ticker (e.g., AAPL)" required />
                        <input type="number" id="eepEntryPrice" placeholder="Entry Price (e.g., 150.00)" required />
                        <input type="number" id="eepExitPrice" placeholder="Exit Price (e.g., 155.00)" required />
                        <input type="date" id="eepDate" placeholder="Date" required />
                        <textarea id="eepNotes" placeholder="Notes (optional)"></textarea>
                        <button type="submit">Post EEP</button>
                    </form>
                `;

                // Add event listener for the EEP form submission
                document.getElementById("eepForm").addEventListener("submit", async (e) => {
                    e.preventDefault(); // Prevent form from refreshing the page
                    const ticker = document.getElementById("eepTicker").value;
                    const entryPrice = parseFloat(document.getElementById("eepEntryPrice").value);
                    const exitPrice = parseFloat(document.getElementById("eepExitPrice").value);
                    const date = document.getElementById("eepDate").value;
                    const notes = document.getElementById("eepNotes").value;

                    const eepData = {
                        type: "eep",
                        ticker,
                        entryPrice,
                        exitPrice,
                        date,
                        notes,
                        userId: firebase.auth().currentUser.uid, // Associate the post with the current user
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(), // Add a timestamp
                    };

                    await postEEP(eepData);
                });
            }
        });
    }

    // Fetch and display posts
    const postsList = document.getElementById("postsList");
    if (postsList) {
        fetchPosts();

        // Apply Filters
        document.getElementById("applyFilters").addEventListener("click", () => {
            const ticker = document.getElementById("filterTicker").value.trim();
            const date = document.getElementById("filterDate").value;
            fetchPosts({ ticker, date });
        });

        // Clear Filters
        document.getElementById("clearFilters").addEventListener("click", () => {
            document.getElementById("filterTicker").value = "";
            document.getElementById("filterDate").value = "";
            fetchPosts(); // Fetch all posts
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get("id");

    if (postId) {
        fetchPostDetails(postId);
    }

    
});

// Function to post an EEP to Firestore
async function postEEP(eepData) {
    try {
        const docRef = await db.collection("posts").add({
            ...eepData,
            type: "eep", // Ensure the post type is set
            sold: false, // Default to unsold
            createdAt: firebase.firestore.FieldValue.serverTimestamp(), // Add timestamp
        });
        console.log("EEP posted with ID:", docRef.id);
        alert("EEP posted successfully!");
    } catch (error) {
        console.error("Error posting EEP:", error.message);
        alert("Error posting EEP: " + error.message);
    }
}

let lastVisible = null; // Track the last visible document for pagination

// Function to fetch and display posts
async function fetchPosts(filters = {}, loadMore = false) {
    try {
        const postsList = document.getElementById("postsList");
        if (!loadMore) {
            postsList.innerHTML = "<p>Loading posts...</p>";
        }

        let query = db.collection("posts").orderBy("createdAt", "desc").limit(9); // Load 9 posts at a time

        // Apply filters dynamically
        if (filters.ticker && filters.date) {
            query = query
                .where("ticker", "==", filters.ticker.toUpperCase())
                .where("date", "==", filters.date);
        } else if (filters.ticker) {
            query = query.where("ticker", "==", filters.ticker.toUpperCase());
        } else if (filters.date) {
            query = query.where("date", "==", filters.date);
        }

        // Apply pagination
        if (loadMore && lastVisible) {
            query = query.startAfter(lastVisible);
        }

        const querySnapshot = await query.get();
        if (!loadMore) {
            postsList.innerHTML = ""; // Clear the loading message
        }

        querySnapshot.forEach((doc) => {
            const post = doc.data();
            const postId = doc.id;

            const postElement = `
                <div class="post">
                    <h3><a href="post-details.html?id=${postId}">${post.ticker || "No Ticker"} (EEP)</a></h3>
                    ${post.sold ? '<span class="sold-badge">Sold</span>' : ""}
                    <p><strong>Entry Price:</strong> $${post.entryPrice || "N/A"}</p>
                    <p><strong>Exit Price:</strong> $${post.exitPrice || "N/A"}</p>
                    <p><strong>Date:</strong> ${post.date || "N/A"}</p>
                    <p><strong>Notes:</strong> ${post.notes || "No notes provided"}</p>
                    <p><small>Posted by: ${post.userId || "Unknown"}</small></p>
                    <div class="post-actions">
                        <button class="edit-button" data-id="${postId}" ${post.sold ? "disabled" : ""}>Edit</button>
                        <button class="delete-button" data-id="${postId}" ${post.sold ? "disabled" : ""}>Delete</button>
                    </div>
                </div>
            `;
            postsList.innerHTML += postElement;
        });

        // Update the last visible document for pagination
        lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

        if (querySnapshot.empty && !loadMore) {
            postsList.innerHTML = "<p>No posts found.</p>";
        }
    } catch (error) {
        console.error("Error fetching posts:", error.message);
        alert("Error fetching posts: " + error.message);
    }
}

// Function to fetch post details
async function fetchPostDetails(postId) {
    try {
        const postDetailsContainer = document.getElementById("postDetails");
        postDetailsContainer.innerHTML = "<p>Loading post details...</p>";

        const doc = await db.collection("posts").doc(postId).get();
        if (doc.exists) {
            const post = doc.data();
            console.log("Post details:", post);

            postDetailsContainer.innerHTML = `
                <div class="post">
                    <h3>${post.ticker || "No Ticker"} (EEP)</h3>
                    <p><strong>Entry Price:</strong> $${post.entryPrice || "N/A"}</p>
                    <p><strong>Exit Price:</strong> $${post.exitPrice || "N/A"}</p>
                    <p><strong>Date:</strong> ${post.date || "N/A"}</p>
                    <p><strong>Notes:</strong> ${post.notes || "No notes provided"}</p>
                    <p><small>Posted by: ${post.userId || "Unknown"}</small></p>
                </div>
            `;
        } else {
            postDetailsContainer.innerHTML = "<p>Post not found.</p>";
        }
    } catch (error) {
        console.error("Error fetching post details:", error.message);
        alert("Error fetching post details: " + error.message);
    }
}

// Function to fetch post for editing
async function fetchPostForEdit(postId) {
    try {
        const doc = await db.collection("posts").doc(postId).get();
        if (doc.exists) {
            const post = doc.data();
            console.log("Post to edit:", post);

            document.getElementById("editTicker").value = post.ticker || "";
            document.getElementById("editEntryPrice").value = post.entryPrice || "";
            document.getElementById("editExitPrice").value = post.exitPrice || "";
            document.getElementById("editDate").value = post.date || "";
            document.getElementById("editNotes").value = post.notes || "";
        } else {
            alert("Post not found.");
        }
    } catch (error) {
        console.error("Error fetching post for edit:", error.message);
        alert("Error fetching post for edit: " + error.message);
    }
}

// Function to update a post
async function updatePost(postId, updatedPost) {
    try {
        const doc = await db.collection("posts").doc(postId).get();
        if (!doc.exists) {
            alert("Post not found.");
            return;
        }

        const post = doc.data();
        const currentTime = new Date();
        const createdAt = post.createdAt.toDate(); // Convert Firestore timestamp to JS Date
        const timeDifference = currentTime - createdAt; // Time difference in milliseconds
        const timeLimit = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const isAdmin = firebase.auth().currentUser?.email === "admin@example.com"; // Replace with your admin logic

        if (post.sold && !isAdmin) {
            alert("This post has been sold and cannot be edited or deleted.");
            return;
        }
        if (timeDifference > timeLimit && !isAdmin) {
            alert("You can only edit or delete posts within 24 hours of creation.");
            return;
        }

        await db.collection("posts").doc(postId).update(updatedPost);
        alert("Post updated successfully!");
        window.location.href = "view-posts.html"; // Redirect back to posts page
    } catch (error) {
        console.error("Error updating post:", error.message);
        alert("Error updating post: " + error.message);
    }
}

// Function to delete a post
async function deletePost(postId) {
    try {
        const doc = await db.collection("posts").doc(postId).get();
        if (!doc.exists) {
            alert("Post not found.");
            return;
        }

        const post = doc.data();
        const currentTime = new Date();
        const createdAt = post.createdAt.toDate(); // Convert Firestore timestamp to JS Date
        const timeDifference = currentTime - createdAt; // Time difference in milliseconds
        const timeLimit = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const isAdmin = firebase.auth().currentUser?.email === "admin@example.com"; // Replace with your admin logic

        if (post.sold && !isAdmin) {
            alert("This post has been sold and cannot be edited or deleted.");
            return;
        }
        if (timeDifference > timeLimit && !isAdmin) {
            alert("You can only edit or delete posts within 24 hours of creation.");
            return;
        }

        await db.collection("posts").doc(postId).delete();
        alert("Post deleted successfully!");
        fetchPosts(); // Refresh the posts list
    } catch (error) {
        console.error("Error deleting post:", error.message);
        alert("Error deleting post: " + error.message);
    }
}

// Function to update existing posts
async function updateExistingPosts() {
    try {
        const querySnapshot = await db.collection("posts").where("type", "==", "eep").get();
        querySnapshot.forEach(async (doc) => {
            const post = doc.data();
            if (post.sold === undefined) {
                // Add the `sold` field if it doesn't exist
                await db.collection("posts").doc(doc.id).update({
                    sold: false, // Default to unsold
                });
                console.log(`Updated post ID: ${doc.id}`);
            }
        });
        alert("All existing posts updated successfully!");
    } catch (error) {
        console.error("Error updating existing posts:", error.message);
        alert("Error updating existing posts: " + error.message);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const postsList = document.getElementById("postsList");
    if (postsList) {
        fetchPosts();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get("id");

    if (postId) {
        fetchPostForEdit(postId);

        document.getElementById("editPostForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            const updatedPost = {
                ticker: document.getElementById("editTicker").value,
                entryPrice: parseFloat(document.getElementById("editEntryPrice").value),
                exitPrice: parseFloat(document.getElementById("editExitPrice").value),
                date: document.getElementById("editDate").value,
                notes: document.getElementById("editNotes").value,
            };
            await updatePost(postId, updatedPost);
        });
    }
});

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("buy-button")) {
        const postId = e.target.getAttribute("data-id");
        alert(`Buy button clicked for post ID: ${postId}`);
        // Add your "Buy" logic here
    }

    // Handle "Edit" button click
    if (e.target.classList.contains("edit-button")) {
        const postId = e.target.getAttribute("data-id");
        console.log(`Edit button clicked for post ID: ${postId}`);
        // Redirect to an edit page or open an edit form
        window.location.href = `edit-post.html?id=${postId}`;
    }

    // Handle "Delete" button click
    if (e.target.classList.contains("delete-button")) {
        const postId = e.target.getAttribute("data-id");
        console.log(`Delete button clicked for post ID: ${postId}`);
        if (confirm("Are you sure you want to delete this post?")) {
            deletePost(postId);
        }
    }
});