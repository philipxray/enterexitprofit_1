// Function to create a new post with the correct schema
async function createPost(ticker, entryPrice, exitPrice, date, notes) {
    try {
        console.log("Checking if createPost is being called intentionally...");
        if (!ticker || isNaN(entryPrice) || isNaN(exitPrice) || !date) {
            alert("Please fill out all required fields.");
            return;
        }

        console.log("Creating post with data:", { ticker, entryPrice, exitPrice, date, notes });

        const newPost = {
            ticker: ticker || "N/A",
            entryPrice: entryPrice || 0,
            exitPrice: exitPrice || 0,
            date: date || "N/A",
            notes: notes || "No notes provided.",
            createdAt: firebase.firestore.Timestamp.now()
        };

        console.log("New post object:", newPost);

        // Add the new post to Firestore
        const docRef = await db.collection("posts").add(newPost);
        console.log("New post added successfully with ID:", docRef.id);
        alert("Post created successfully!");
    } catch (error) {
        console.error("Error creating post:", error.message);
        alert("Error creating post: " + error.message);
    }
}

// Function to handle form submission
async function handlePostFormSubmit(event) {
    event.preventDefault(); // Prevent the form from refreshing the page

    // Get form values
    const ticker = document.getElementById("ticker").value;
    const entryPrice = parseFloat(document.getElementById("entryPrice").value);
    const exitPrice = parseFloat(document.getElementById("exitPrice").value);
    const date = document.getElementById("date").value;
    const notes = document.getElementById("notes").value;

    console.log("Form data:", { ticker, entryPrice, exitPrice, date, notes });

    // Call the createPost function
    await createPost(ticker, entryPrice, exitPrice, date, notes);

    // Clear the form
    document.getElementById("postForm").reset();
}

// Attach the form submission handler
document.addEventListener("DOMContentLoaded", () => {
    const postForm = document.getElementById("postForm");
    if (postForm) {
        postForm.addEventListener("submit", handlePostFormSubmit);
    }
});