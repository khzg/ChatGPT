// List of URLs to delete
const linksToRemove = [
    "https://chatgpt.com",
    "https://gemini.google.com/app",
    "https://copilot.microsoft.com/",
    "https://www.bing.com/images/create/",
    "https://duckduckgo.com/?q=DuckDuckGo&ia=chat",
    "https://www.perplexity.ai/",
    "https://poe.com",
    "https://you.com/search?q=hi&fromSearchBar=true&tbm=youchat",
    "https://app.suno.ai/create/",
    "https://www.udio.com/create"
];

// Function to delete specific history URLs
async function deleteHistory() {
    console.log("Starting history cleanup...");

    for (const url of linksToRemove) {
        try {
            // Check if URL exists in history before deleting
            const results = await browser.history.search({ text: url, maxResults: 1 });
            if (results.length > 0) {
                await browser.history.deleteUrl({ url });
                console.log(`Deleted history for ${url}`);
            } else {
                console.log(`URL not found in history: ${url}`);
            }
        } catch (error) {
            console.error(`Failed to delete ${url}:`, error);
        }
    }

    console.log("History cleanup completed.");
}


// Function to check if we should run the cleanup today
async function runOnceDaily() {
    const storage = await browser.storage.local.get("last1Run");
    const lastRun = storage.lastRun || 0;

    // Get the current time and calculate the difference
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // If more than a day has passed, run the cleanup
    if (now - lastRun > oneDay) {
        console.log("Running cleanup...");
        await deleteHistory();

        // Update the last run timestamp
        await browser.storage.local.set({ lastRun: now });
    } else {
        console.log("Cleanup already ran today. Skipping...");
    }
}

// Call the function when the extension is loaded
runOnceDaily();
