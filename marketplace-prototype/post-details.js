document.addEventListener("DOMContentLoaded", async () => {
    try {
        console.log("Script loaded and DOM fully parsed.");

        // Simulate fetching post details (replace this with actual Firebase Firestore logic)
        const postDetails = await fetchPostDetails(); // Fetch post details from Firestore
        console.log("Post details fetched:", postDetails);

        // Populate the post details
        document.getElementById("postEntryPrice").textContent = `$${postDetails.entryPrice}`;
        document.getElementById("postExitPrice").textContent = `$${postDetails.exitPrice}`;
        document.getElementById("postDate").textContent = postDetails.date;
        document.getElementById("postNotes").textContent = postDetails.notes;

        // Make the Ticker a link
        const tickerElement = document.getElementById("postTicker");
        if (tickerElement) {
            console.log("Ticker element before update:", tickerElement.innerHTML);
            tickerElement.innerHTML = `
                <a href="ticker-details.html?ticker=${encodeURIComponent(postDetails.ticker)}">
                    ${postDetails.ticker}
                </a>
            `;
            console.log("Ticker link created:", tickerElement.innerHTML);

            // Monitor for overwriting
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    console.warn("Mutation detected:", mutation);
                    console.log("Reapplying Ticker link...");
                    tickerElement.innerHTML = `
                        <a href="ticker-details.html?ticker=${encodeURIComponent(postDetails.ticker)}">
                            ${postDetails.ticker}
                        </a>
                    `;
                });
            });

            observer.observe(tickerElement, { childList: true, subtree: true });
        } else {
            console.error("Ticker element not found in the DOM.");
        }
    } catch (error) {
        console.error("Error loading post details:", error);
    }
});

// Simulate fetching post details from Firestore
async function fetchPostDetails() {
    // Replace this with actual Firestore logic
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                ticker: "AAPL", // Example ticker
                entryPrice: 150,
                exitPrice: 160,
                date: "2025-04-18",
                notes: "This is a sample trade alert.",
            });
        }, 1000); // Simulate Firestore delay
    });
}