console.log("option-chain.js is loaded");

document.getElementById("fetchOptions").addEventListener("click", async () => {
    const stockSymbol = document.getElementById("stockSymbol").value.toUpperCase();
    if (!stockSymbol) {
        alert("Please enter a stock symbol.");
        return;
    }

    console.log("Fetching options for:", stockSymbol);

    try {
        // Fetch option chain data from Finnhub API
        const response = await fetch(`https://finnhub.io/api/v1/stock/option-chain?symbol=${stockSymbol}&token=d00t85hr01qv3oh1bi90d00t85hr01qv3oh1bi9g`);
        const data = await response.json();

        console.log("API Response:", data);
       

        // Check if the API returned valid data
        if (!data || !data.data) {
            alert("No option chain data found for the given stock symbol.");
            return;
        }

        // Populate the option chain table
        const optionChainTable = document.getElementById("optionChainTable");
        optionChainTable.innerHTML = `
            <table class="option-chain-table">
                <thead>
                    <tr>
                        <th>Strike Price</th>
                        <th>Call Volume</th>
                        <th>Put Volume</th>
                        <th>Call Open Interest</th>
                        <th>Put Open Interest</th>
                        <th>Expiration Date</th>
                        <th>Implied Volatility</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.data.map(option => {
                        console.log("Option Strike:", option.strike);
                        console.log("Option Expiration Date:", option.expirationDate);
                        return `
                        <tr>
                            <td>${option.strike}</td>
                            <td>${option.callVolume || "N/A"}</td>
                            <td>${option.putVolume || "N/A"}</td>
                            <td>${option.callOpenInterest || "N/A"}</td>
                            <td>${option.putOpenInterest || "N/A"}</td>
                            <td>${option.expirationDate || "N/A"}</td>
                            <td>${option.impliedVolatility || "N/A"}</td>
                            <td>
                                <a href="option-details.html?symbol=${stockSymbol}&strike=${option.strike}&expiration=${option.expirationDate}">View Details</a>
                            </td>
                        </tr>
                        `;
                    }).join("")}
                </tbody>
            </table>
        `;

        // Example usage of the suggested code change
        const strikePrice = 100; // Replace with actual strike price
        const expirationDate = "2023-12-31"; // Replace with actual expiration date
        const contract = data.data.find(option => 
            option.strike == strikePrice && option.expirationDate == expirationDate
        );
        console.log("Selected Contract:", contract);

    } catch (error) {
        console.error("Error fetching option chain data:", error);
        alert("Failed to fetch option chain data. Please try again later.");
    }
});