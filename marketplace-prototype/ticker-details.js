document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const ticker = urlParams.get("ticker");

    // Display the ticker details
    const tickerDetailsContainer = document.getElementById("tickerDetailsContainer");
    if (ticker) {
        tickerDetailsContainer.innerHTML = `<p>Details for Ticker: <strong>${ticker}</strong></p>`;
        console.log(`Ticker details loaded for: ${ticker}`);

        // Fetch stock data and render the charts
        const stockData = await fetchStockData(ticker);
        if (stockData.length > 0) {
            renderStockChart(stockData); // Render the first chart
            renderVolumeChart(stockData); // Render the second chart
        } else {
            console.error("No stock data available to render the charts.");
        }
    } else {
        tickerDetailsContainer.innerHTML = `<p>No ticker specified in the URL.</p>`;
        console.warn("No ticker found in the URL query parameters.");
    }
});

// Function to fetch stock data from Alpha Vantage
async function fetchStockData(ticker) {
    console.log(`Fetching stock data for: ${ticker}`);

    const cacheKey = `stockData_${ticker}`;
    const cacheExpiryKey = `stockDataExpiry_${ticker}`;
    const cacheExpiryTime = 60 * 60 * 1000; // 1 hour in milliseconds

    // Check if data is cached and not expired
    const cachedData = localStorage.getItem(cacheKey);
    const cacheExpiry = localStorage.getItem(cacheExpiryKey);
    if (cachedData && cacheExpiry && Date.now() < parseInt(cacheExpiry, 10)) {
        console.log("Using cached data for:", ticker);
        return JSON.parse(cachedData);
    }

    // Fetch data from the API
    const apiKey = "78VM8Q9Q54LL5NXU"; // Replace with your Alpha Vantage API key
    const apiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=${apiKey}`;

    try {
        console.log(`API URL: ${apiUrl}`);
        const response = await fetch(apiUrl);
        console.log(`Response status: ${response.status}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log("Raw API response:", data);

        // Check if the API returned an error
        if (!data["Time Series (Daily)"]) {
            throw new Error("Error fetching data from Alpha Vantage");
        }

        // Parse the data into the required format
        const timeSeries = data["Time Series (Daily)"];
        const parsedData = Object.keys(timeSeries).map((date) => {
            const dailyData = timeSeries[date];
            return {
                Date: new Date(date).getTime(), // Convert date to timestamp
                Open: parseFloat(dailyData["1. open"]),
                High: parseFloat(dailyData["2. high"]),
                Low: parseFloat(dailyData["3. low"]),
                Close: parseFloat(dailyData["4. close"]),
                Volume: parseInt(dailyData["5. volume"], 10), // Note: Volume is "5. volume" here
            };
        });

        // Sort the data by date (ascending)
        parsedData.sort((a, b) => a.Date - b.Date);

        console.log("Parsed stock data:", parsedData);

        // Cache the data
        localStorage.setItem(cacheKey, JSON.stringify(parsedData));
        localStorage.setItem(cacheExpiryKey, (Date.now() + cacheExpiryTime).toString());
        console.log("Data cached for:", ticker);

        return parsedData;
    } catch (error) {
        console.error("Error fetching stock data:", error);
        return [];
    }
}

let originalData = [
    { Date: 1617278400000, Volume: 3938600 },
    { Date: 1617624000000, Volume: 3355900 },
    // More data points...
];

function renderStockChart(data) {
    console.log("Initializing the stock chart...");

    try {
        const root = am5.Root.new("chartdiv");
        console.log("Root element created for stock chart:", root);

        root.setThemes([am5themes_Animated.new(root)]);
        console.log("Themes applied to stock chart.");

        const stockChart = root.container.children.push(
            am5stock.StockChart.new(root, {
                paddingRight: 0,
            })
        );

        const mainPanel = stockChart.panels.push(
            am5stock.StockPanel.new(root, {
                wheelY: "zoomX",
                panX: true,
                panY: true,
            })
        );

        const valueAxis = mainPanel.yAxes.push(
            am5xy.ValueAxis.new(root, {
                renderer: am5xy.AxisRendererY.new(root, {
                    pan: "zoom",
                }),
                tooltip: am5.Tooltip.new(root, {}),
            })
        );

        const dateAxis = mainPanel.xAxes.push(
            am5xy.GaplessDateAxis.new(root, {
                baseInterval: { timeUnit: "day", count: 1 },
                renderer: am5xy.AxisRendererX.new(root, {}),
                tooltip: am5.Tooltip.new(root, {}),
            })
        );

        const valueSeries = mainPanel.series.push(
            am5xy.CandlestickSeries.new(root, {
                name: "Stock Price",
                clustered: false,
                valueXField: "Date",
                valueYField: "Close",
                highValueYField: "High",
                lowValueYField: "Low",
                openValueYField: "Open",
                xAxis: dateAxis,
                yAxis: valueAxis,
            })
        );

        valueSeries.data.setAll(data);
        console.log("Data set for stock chart:", data);
    } catch (error) {
        console.error("Error rendering stock chart:", error);
    }
}

// Function to update chart data based on date range
function updateChartData(startDate, endDate) {
    const filteredData = originalData.filter((dataPoint) => {
        return dataPoint.Date >= startDate.getTime() && dataPoint.Date <= endDate.getTime();
    });

    console.log("Filtered data:", filteredData);

    // Update the chart with the filtered data
    valueSeries.data.setAll(filteredData);
}

// Function to update chart data based on selected period
function updateChartPeriod(period) {
    const now = new Date();
    let startDate;

    switch (period) {
        case "5D":
            startDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
            break;
        case "1M":
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); // 1 month ago
            break;
        case "3M":
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()); // 3 months ago
            break;
        case "6M":
            startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()); // 6 months ago
            break;
        case "1Y":
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); // 1 year ago
            break;
        default:
            startDate = new Date(0); // Default to all data
    }

    console.log(`Period start date: ${startDate}, end date: ${now}`);

    // Update the chart with the filtered data
    updateChartData(startDate, now);
}

function renderVolumeChart(data) {
    console.log("Initializing the volume chart...");

    try {
        const root = am5.Root.new("volumeChartDiv");
        console.log("Root element created for volume chart:", root);

        root.setThemes([am5themes_Animated.new(root)]);
        console.log("Themes applied to volume chart.");

        const stockChart = root.container.children.push(
            am5stock.StockChart.new(root, {
                paddingRight: 0,
            })
        );

        const mainPanel = stockChart.panels.push(
            am5stock.StockPanel.new(root, {
                wheelY: "zoomX",
                panX: true,
                panY: true,
            })
        );

        const valueAxis = mainPanel.yAxes.push(
            am5xy.ValueAxis.new(root, {
                renderer: am5xy.AxisRendererY.new(root, {
                    pan: "zoom",
                }),
                tooltip: am5.Tooltip.new(root, {}),
            })
        );

        const dateAxis = mainPanel.xAxes.push(
            am5xy.GaplessDateAxis.new(root, {
                baseInterval: { timeUnit: "day", count: 1 },
                renderer: am5xy.AxisRendererX.new(root, {}),
                tooltip: am5.Tooltip.new(root, {}),
            })
        );

        const volumeSeries = mainPanel.series.push(
            am5xy.ColumnSeries.new(root, {
                name: "Volume",
                valueXField: "Date",
                valueYField: "Volume",
                xAxis: dateAxis,
                yAxis: valueAxis,
                clustered: false,
            })
        );

        volumeSeries.set("tooltip", am5.Tooltip.new(root, {
            labelText: "Date: {valueX.formatDate()}\nVolume: {valueY.formatNumber('#,###')}"
        }));

        volumeSeries.data.setAll(data);
        console.log("Data set for volume chart:", data);
    } catch (error) {
        console.error("Error rendering volume chart:", error);
    }
}

const mockData = [
    { Date: 1617278400000, Volume: 3938600 },
    { Date: 1617624000000, Volume: 3355900 },
    { Date: 1617710400000, Volume: 3474200 },
    { Date: 1617796800000, Volume: 2151300 },
    { Date: 1617883200000, Volume: 4309800 },
];

const mockVolumeData = [
    { Date: 1617278400000, Volume: 3938600 },
    { Date: 1617624000000, Volume: 3355900 },
    { Date: 1617710400000, Volume: 3474200 },
    { Date: 1617796800000, Volume: 2151300 },
    { Date: 1617883200000, Volume: 4309800 },
];
renderVolumeChart(mockVolumeData);

const mockStockData = [
    { Date: 1617278400000, Open: 100, High: 110, Low: 95, Close: 105 },
    { Date: 1617624000000, Open: 106, High: 115, Low: 100, Close: 110 },
    { Date: 1617710400000, Open: 111, High: 120, Low: 105, Close: 115 },
    { Date: 1617796800000, Open: 116, High: 125, Low: 110, Close: 120 },
    { Date: 1617883200000, Open: 121, High: 130, Low: 115, Close: 125 },
];
renderStockChart(mockStockData);