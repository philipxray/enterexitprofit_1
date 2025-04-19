document.addEventListener("DOMContentLoaded", async () => {
    // Get query parameters from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const stockSymbol = urlParams.get("symbol");
    const expirationDate = urlParams.get("expiration");

    if (!stockSymbol || !expirationDate) {
        alert("Invalid option contract details.");
        return;
    }

    console.log(`Fetching details for ${stockSymbol}, Expiration: ${expirationDate}`);

    try {
        // Fetch option chain data from Finnhub API
        const response = await fetch(`https://finnhub.io/api/v1/stock/option-chain?symbol=${stockSymbol}&token=d00t85hr01qv3oh1bi90d00t85hr01qv3oh1bi9g`);
        const data = await response.json();

        console.log("Full API Response:", data);

        // Check if the API returned valid data
        if (!data || !data.data) {
            alert("No option chain data found for the given stock symbol.");
            return;
        }

        // Find the data for the specific expiration date
        const expirationData = data.data.find(option => option.expirationDate === expirationDate);

        if (!expirationData) {
            alert("No data found for the selected expiration date.");
            return;
        }

        console.log("Expiration Data Found:", expirationData);

        // Populate the contract details
        const optionDetails = document.getElementById("optionDetails");
        optionDetails.innerHTML = `
            <p><strong>Ticker:</strong> ${stockSymbol}</p>
            <p><strong>EXP:</strong> ${expirationData.expirationDate}</p>
            <p><strong>IV:</strong> ${expirationData.impliedVolatility || "N/A"}</p>
            <p><strong>Call Vol:</strong> ${expirationData.callVolume || "N/A"}</p>
            <p><strong>Put Vol:</strong> ${expirationData.putVolume || "N/A"}</p>
            <p><strong>Put/Call Volume Ratio:</strong> ${expirationData.putCallVolumeRatio || "N/A"}</p>
        `;

        // Render the gauge meter for implied volatility
        const impliedVolatility = expirationData.impliedVolatility || 0;

        // Initialize amCharts gauge chart
        am5.ready(function () {
            // Create root element
            var root = am5.Root.new("chartdiv");

            // Set themes
            root.setThemes([am5themes_Animated.new(root)]);

            // Create chart
            var chart = root.container.children.push(
                am5radar.RadarChart.new(root, {
                    panX: false,
                    panY: false,
                    startAngle: 160,
                    endAngle: 380,
                })
            );

            // Create axis and its renderer
            var axisRenderer = am5radar.AxisRendererCircular.new(root, {
                innerRadius: -40,
            });

            axisRenderer.grid.template.setAll({
                stroke: root.interfaceColors.get("background"),
                visible: true,
                strokeOpacity: 0.8,
            });

            var xAxis = chart.xAxes.push(
                am5xy.ValueAxis.new(root, {
                    maxDeviation: 0,
                    min: 0,
                    max: 100,
                    strictMinMax: true,
                    renderer: axisRenderer,
                })
            );

            // Add clock hand
            var axisDataItem = xAxis.makeDataItem({});
            var clockHand = am5radar.ClockHand.new(root, {
                pinRadius: am5.percent(15), // Smaller pin at the center
                radius: am5.percent(80),    // Shorter clock hand
                bottomWidth: 20,            // Narrower base width
            });

            var bullet = axisDataItem.set(
                "bullet",
                am5xy.AxisBullet.new(root, {
                    sprite: clockHand,
                })
            );

            xAxis.createAxisRange(axisDataItem);

            // Add label for the number on the clock hand
            var label = chart.radarContainer.children.push(
                am5.Label.new(root, {
                    fill: am5.color(0xffffff),
                    centerX: am5.percent(50),
                    textAlign: "center",
                    centerY: am5.percent(50),
                    fontSize: "1em", // Adjust the size of the number here
                })
            );

            axisDataItem.set("value", impliedVolatility);
            bullet.get("sprite").on("rotation", function () {
                label.set("text", Math.round(axisDataItem.get("value")).toString());
            });

            // Create axis ranges bands
            var bandsData = [
                { title: "Low", color: "#54b947", lowScore: 0, highScore: 33 },
                { title: "Medium", color: "#fdae19", lowScore: 33, highScore: 66 },
                { title: "High", color: "#ee1f25", lowScore: 66, highScore: 100 },
            ];

            am5.array.each(bandsData, function (data) {
                var axisRange = xAxis.createAxisRange(xAxis.makeDataItem({}));

                axisRange.setAll({
                    value: data.lowScore,
                    endValue: data.highScore,
                });

                axisRange.get("axisFill").setAll({
                    visible: true,
                    fill: am5.color(data.color),
                    fillOpacity: 0.8,
                });

                axisRange.get("label").setAll({
                    text: data.title,
                    inside: true,
                    radius: 15,
                    fontSize: "0.9em",
                    fill: root.interfaceColors.get("background"),
                });
            });

            // Make stuff animate on load
            chart.appear(1000, 100);
        });
    } catch (error) {
        console.error("Error fetching option contract details:", error);
        alert("Failed to fetch option contract details. Please try again later.");
    }
});