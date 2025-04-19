// Attach event listener for post type selection
// Dynamically loads a form based on the selected post type (e.g., EEP).
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
    // This section fetches posts from Firestore and displays them on the page.
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

    // Fetch post details if a post ID is present in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get("id");
    console.log("Post ID from URL:", postId); // Debugging log
    if (postId) {
        fetchPostDetails(postId);
    } else {
        console.error("No post ID found in the URL.");
    }

    // Handle edit-post.html page logic
    const currentPage = window.location.pathname.split("/").pop(); // Get the current page name
    console.log("Current page:", currentPage); // Debugging log

    if (currentPage === "edit-post.html") {
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get("id");

        if (postId) {
            fetchPostForEdit(postId);

            const editPostForm = document.getElementById("editPostForm");
            if (editPostForm) {
                editPostForm.addEventListener("submit", async (e) => {
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
            } else {
                console.error("Edit post form not found in the DOM.");
            }
        } else {
            console.error("No post ID found in the URL.");
        }
    }
});

// Function to post an EEP to Firestore
// This function adds a new EEP post to the Firestore database.
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



// Function to fetch and display posts
// Fetches posts from Firestore and displays them on the page.
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
// Fetches details for a specific post from Firestore.
async function fetchPostDetails(postId) {
    try {
        console.log(`Fetching details for post ID: ${postId}`); // Debugging log

        // Fetch the post from Firestore
        const postDoc = await db.collection("posts").doc(postId).get();
        if (!postDoc.exists) {
            throw new Error("Post not found");
        }

        const post = postDoc.data();
        console.log("Fetched post data:", post); // Debugging log

        // Populate the fields with post data
        document.getElementById("postTicker").innerText = post.ticker || "N/A";
        document.getElementById("postEntryPrice").innerText = `$${post.entryPrice || "N/A"}`;
        document.getElementById("postExitPrice").innerText = `$${post.exitPrice || "N/A"}`;
        document.getElementById("postDate").innerText = post.date || "N/A";
        document.getElementById("postNotes").innerText = post.notes || "No notes provided.";
    } catch (error) {
        console.error("Error fetching post details:", error.message);
        alert("Error fetching post details: " + error.message);
    }
}

// Function to fetch post for editing
// Fetches a post from Firestore and populates the edit form with its data.
async function fetchPostForEdit(postId) {
    try {
        const doc = await db.collection("posts").doc(postId).get();
        if (doc.exists) {
            const post = doc.data();
            console.log("Post to edit:", post);

            const editTicker = document.getElementById("editTicker");
            if (editTicker) {
                editTicker.value = post.ticker || "";
            } else {
                console.error("Element with id 'editTicker' not found.");
            }

            const editEntryPrice = document.getElementById("editEntryPrice");
            if (editEntryPrice) {
                editEntryPrice.value = post.entryPrice || "";
            } else {
                console.error("Element with id 'editEntryPrice' not found.");
            }

            const editExitPrice = document.getElementById("editExitPrice");
            if (editExitPrice) {
                editExitPrice.value = post.exitPrice || "";
            } else {
                console.error("Element with id 'editExitPrice' not found.");
            }

            const editDate = document.getElementById("editDate");
            if (editDate) {
                editDate.value = post.date || "";
            } else {
                console.error("Element with id 'editDate' not found.");
            }

            const editNotes = document.getElementById("editNotes");
            if (editNotes) {
                editNotes.value = post.notes || "";
            } else {
                console.error("Element with id 'editNotes' not found.");
            }
        } else {
            alert("Post not found.");
        }
    } catch (error) {
        console.error("Error fetching post for edit:", error.message);
        alert("Error fetching post for edit: " + error.message);
    }
}

// Function to update a post
// Updates a specific post in Firestore with new data.
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
// Deletes a specific post from Firestore.
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
// Adds missing fields to existing posts in Firestore.
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