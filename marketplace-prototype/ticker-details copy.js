document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const ticker = urlParams.get("ticker");

    // Display the ticker details
    const tickerDetailsContainer = document.getElementById("tickerDetailsContainer");
    if (ticker) {
        tickerDetailsContainer.innerHTML = `<p>Details for Ticker: <strong>${ticker}</strong></p>`;
        console.log(`Ticker details loaded for: ${ticker}`);

        // Fetch stock data and render the chart
        const stockData = await fetchStockData(ticker);
        if (stockData.length > 0) {
            renderStockChart(stockData);
        } else {
            console.error("No stock data available to render the chart.");
        }
    } else {
        tickerDetailsContainer.innerHTML = `<p>No ticker specified in the URL.</p>`;
        console.warn("No ticker found in the URL query parameters.");
    }
});

// Function to fetch stock data (mocked for now)
async function fetchStockData(ticker) {
    console.log(`Fetching stock data for: ${ticker}`);

    // Mock stock data (replace with API call)
    return [
        { Date: 1617278400000, Open: 529.93, High: 540.5, Low: 527.03, Close: 539.42, Volume: 3938600 },
        { Date: 1617624000000, Open: 540.01, High: 542.85, Low: 529.23, Close: 540.67, Volume: 3355900 },
        { Date: 1617710400000, Open: 544.81, High: 554.17, Low: 543.3, Close: 544.53, Volume: 3474200 },
        { Date: 1617796800000, Open: 543.5, High: 549.64, Low: 541.45, Close: 546.99, Volume: 2151300 },
        { Date: 1617883200000, Open: 551.13, High: 556.9, Low: 547.57, Close: 554.58, Volume: 4309800 },
    ];
}

// Function to render the stock chart
function renderStockChart(data) {
    console.log("Initializing the stock chart...");

    try {
        // Create root element
        const root = am5.Root.new("chartdiv");
        console.log("Root element created:", root);

        // Set themes
        root.setThemes([am5themes_Animated.new(root)]);
        console.log("Themes applied.");

        // Create a stock chart
        const stockChart = root.container.children.push(
            am5stock.StockChart.new(root, {
                paddingRight: 0,
            })
        );
        console.log("Stock chart created:", stockChart);

        // Create a main stock panel (chart)
        const mainPanel = stockChart.panels.push(
            am5stock.StockPanel.new(root, {
                wheelY: "zoomX",
                panX: true,
                panY: true,
            })
        );
        console.log("Main stock panel created:", mainPanel);

        // Create value axis
        const valueAxis = mainPanel.yAxes.push(
            am5xy.ValueAxis.new(root, {
                renderer: am5xy.AxisRendererY.new(root, {
                    pan: "zoom",
                }),
                tooltip: am5.Tooltip.new(root, {}),
            })
        );
        console.log("Value axis created:", valueAxis);

        // Create date axis
        const dateAxis = mainPanel.xAxes.push(
            am5xy.GaplessDateAxis.new(root, {
                baseInterval: { timeUnit: "day", count: 1 },
                renderer: am5xy.AxisRendererX.new(root, {}),
                tooltip: am5.Tooltip.new(root, {}),
            })
        );
        console.log("Date axis created:", dateAxis);

        // Add candlestick series
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
        console.log("Candlestick series created:", valueSeries);

        // Set data
        valueSeries.data.setAll(data);
        console.log("Data set for candlestick series:", data);

        // Add scrollbars
        const scrollbarX = am5xy.XYChartScrollbar.new(root, {
            orientation: "horizontal",
            height: 50,
        });
        mainPanel.set("scrollbarX", scrollbarX);
        console.log("Horizontal scrollbar added.");

        // Add a stock toolbar with default controls
        const toolbar = am5stock.StockToolbar.new(root, {
            stockChart: stockChart,
            container: document.getElementById("chartcontrols"), // Attach toolbar to the chartcontrols div
            controls: [
                am5stock.DateRangeSelector.new(root, { stockChart: stockChart }),
                am5stock.PeriodSelector.new(root, { stockChart: stockChart }),
                am5stock.SeriesTypeControl.new(root, { stockChart: stockChart }),
                am5stock.DrawingControl.new(root, { stockChart: stockChart }),
                am5stock.ResetControl.new(root, { stockChart: stockChart }),
            ],
        });
        console.log("Toolbar added to the chart.");

        console.log("Stock chart rendered successfully.");
    } catch (error) {
        console.error("Error rendering stock chart:", error);
    }
}