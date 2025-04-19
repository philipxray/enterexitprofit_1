
    // Example query to fetch posts
    const query = db.collection("posts");
    console.log("Executing query:", query);
    const querySnapshot = await query.get();
    console.log("Query results:", querySnapshot.docs);

// Function to fetch posts with filters
async function fetchPosts(filters = {}, loadMore = false) {
    try {
        const postsList = document.getElementById("postsList");
        if (!postsList) {
            console.error("Error: postsList element not found.");
            return;
        }
        if (!loadMore) {
            postsList.innerHTML = ""; // Clear the list before loading new posts
        }

        let query = db.collection("posts").orderBy("createdAt", "desc").limit(9); // Load 9 posts at a time

        // Apply filters dynamically
        if (filters.ticker) {
            query = query.where("ticker", "==", filters.ticker.toUpperCase());
        }
        if (filters.date) {
            query = query.where("date", "==", filters.date);
        }

        const querySnapshot = await query.get();
        console.log("Query results:", querySnapshot.docs); // Debugging: Log the query results

        querySnapshot.forEach((doc) => {
            const post = doc.data();
            const postId = doc.id;

            // Generate the HTML for each post
            const postElement = `
                <div class="post">
                    <h3>Ticker: ${post.ticker || "N/A"}</h3>
                    <p><strong>Entry Price:</strong> $${post.entryPrice || "N/A"}</p>
                    <p><strong>Exit Price:</strong> $${post.exitPrice || "N/A"}</p>
                    <p><strong>Date:</strong> ${post.date || "N/A"}</p>
                    <p><strong>Notes:</strong> ${post.notes || "No notes provided."}</p>
                    <a href="post-details.html?id=${postId}">View Details</a>
                </div>
            `;
            postsList.innerHTML += postElement;
        });

        if (querySnapshot.empty) {
            postsList.innerHTML = "<p>No posts found.</p>";
        }
    } catch (error) {
        console.error("Error fetching posts:", error.message);
        alert("Error fetching posts: " + error.message);
    }
}

// Add event listeners to the Buy and Sell buttons
document.addEventListener("DOMContentLoaded", () => {
    const buyButton = document.querySelector(".buy-button");
    const sellButton = document.querySelector(".sell-button");

    // Action for Buy Button
    buyButton.addEventListener("click", () => {
        alert("Buy Alert clicked!");
        // Add additional functionality here
        });
    });

    // Action for Sell Button
    sellButton.addEventListener("click", () => {
        alert("Sell Alert clicked!");
        // Add additional functionality here
    });

    // Handle authentication state changes
firebase.auth().onAuthStateChanged(async (user) => {
    console.log("Auth state changed:", user);
    const addPostButton = document.getElementById("addPostButton");
    if (addPostButton) {
        if (user) {
            addPostButton.classList.remove("hidden");
        } else {
            addPostButton.classList.add("hidden");
        }
    }
});