// ==============================
// FinGuard AI Dashboard
// ==============================

document.addEventListener("DOMContentLoaded", function () {

    // -------------------------
    // Animated Counters
    // -------------------------

    document.querySelectorAll(".card h2").forEach(counter => {

        let text = counter.innerText;

        let value = parseFloat(text.replace(/[^\d.]/g, ""));

        if (isNaN(value)) return;

        let current = 0;

        let step = value / 80;

        function update() {

            current += step;

            if (current >= value) {

                counter.innerText = text;

                return;

            }

            if (text.includes("%")) {

                counter.innerText = current.toFixed(1) + "%";

            }

            else {

                counter.innerText = Math.floor(current).toLocaleString();

            }

            requestAnimationFrame(update);

        }

        update();

    });

    // -------------------------
    // Line Chart
    // -------------------------

    const txChart = document.getElementById("transactionChart");

    if (txChart) {

        new Chart(txChart, {

            type: "line",

            data: {

                labels: [

                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat",
                    "Sun"

                ],

                datasets: [

                    {

                        label: "Transactions",

                        data: [

                            180,
                            220,
                            260,
                            210,
                            330,
                            420,
                            390

                        ],

                        borderColor: "#2563eb",

                        backgroundColor: "rgba(37,99,235,.12)",

                        fill: true,

                        tension: .4,

                        pointRadius: 4,

                        pointBackgroundColor: "#2563eb"

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        display: false

                    }

                },

                scales: {

                    y: {

                        beginAtZero: true,

                        grid: {

                            color: "#e5e7eb"

                        }

                    },

                    x: {

                        grid: {

                            display: false

                        }

                    }

                }

            }

        });

    }

    // -------------------------
    // Doughnut Chart
    // -------------------------

    const fraudChart = document.getElementById("fraudChart");

    if (fraudChart) {

        new Chart(fraudChart, {

            type: "doughnut",

            data: {

                labels: [

                    "Safe",
                    "Medium",
                    "Fraud"

                ],

                datasets: [

                    {

                        data: [

                            72,
                            18,
                            10

                        ],

                        backgroundColor: [

                            "#22c55e",
                            "#f59e0b",
                            "#ef4444"

                        ],

                        borderWidth: 0

                    }

                ]

            },

            options: {

                cutout: "72%",

                plugins: {

                    legend: {

                        position: "bottom"

                    }

                }

            }

        });

    });

});

// ==============================
// AI Analysis
// ==============================

async function runAnalysis() {

    const transaction = {

        amount: Number(document.getElementById("amount").value),

        merchant: document.getElementById("merchant").value,

        location: document.getElementById("location").value,

        time: document.getElementById("time").value,

        card_type: document.getElementById("card_type").value

    };

    try {

        const response = await fetch("/analyze", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify(transaction)

        });

        const data = await response.json();

        const box = document.getElementById("analysisResult");

        box.style.display = "block";

        box.innerHTML = `

            <h2>🤖 AI Analysis Result</h2>

            <p><strong>Risk Score:</strong> ${data.analysis.risk_score}</p>

            <p><strong>Status:</strong> ${data.analysis.fraud_status}</p>

            <p><strong>Reason:</strong> ${data.analysis.reason}</p>

            <p><strong>Recommendation:</strong> ${data.analysis.recommendation}</p>

        `;

        box.scrollIntoView({

            behavior: "smooth"

        });

    }

    catch (err) {

        alert("Unable to connect to AI Engine.");

        console.log(err);

    }

}
// Live Clock

function updateClock(){

    let clock = document.getElementById("liveClock");

    if(clock){

        clock.innerHTML =
        new Date().toLocaleTimeString();

    }

}


setInterval(updateClock,1000);

updateClock();
function openAssistant(){

alert(
"Hello, I am FinGuard AI Assistant"
);

}
// ==============================
// AI System Status
// ==============================

function updateAIStatus(){

    const status =
    document.getElementById("aiStatus");


    if(status){

        status.innerHTML =
        "🟢 AI Engine Online";

    }

}


updateAIStatus();
// ==============================
// Live Fraud Alerts
// ==============================


function generateAlert(){

    const alerts = [

        "Suspicious transaction detected",

        "High-risk payment blocked",

        "Unusual spending pattern found",

        "Multiple failed login attempts",

        "AI prevented fraud attempt"

    ];


    const alertBox =
    document.getElementById("fraudAlerts");


    if(alertBox){

        let randomAlert =
        alerts[
        Math.floor(Math.random()*alerts.length)
        ];


        alertBox.innerHTML =
        "🔴 " + randomAlert;

    }

}


setInterval(generateAlert,5000);


generateAlert();
// ==============================
// World Transaction Map
// ==============================


const mapContainer =
document.getElementById("map");


if(mapContainer){


const map =
L.map("map")
.setView(
[20,0],
2
);



L.tileLayer(

"https://tile.openstreetmap.org/{z}/{x}/{y}.png",

{

attribution:
"© OpenStreetMap"

}

).addTo(map);



const transactions = [

{
city:"Mumbai",
lat:19.076,
lng:72.877
},

{
city:"London",
lat:51.507,
lng:-0.127
},

{
city:"New York",
lat:40.712,
lng:-74.006
},

{
city:"Tokyo",
lat:35.676,
lng:139.650
}

];



transactions.forEach(tx=>{


L.marker(
[
tx.lat,
tx.lng
]

)

.addTo(map)

.bindPopup(

"💳 Transaction detected<br>"
+
tx.city

);


});


}