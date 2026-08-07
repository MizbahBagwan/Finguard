// ================= FRAUD TREND =================

const trendCtx = document.getElementById("fraudTrendChart");

if (trendCtx) {

    new Chart(trendCtx, {

        type: "line",

        data: {

            labels: ["Jan","Feb","Mar","Apr","May","Jun"],

            datasets: [{

                label: "Fraud Cases",

                data: [8,15,11,22,18,30],

                borderColor: "#4f7cff",

                backgroundColor: "rgba(79,124,255,.2)",

                fill: true,

                tension: 0.4

            }]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {

                    display: false

                }

            }

        }

    });

}



// ================= FRAUD PIE =================

const pieCtx = document.getElementById("fraudPieChart");

if (pieCtx) {

    new Chart(pieCtx, {

        type: "doughnut",

        data: {

            labels: ["Fraud","Safe","Pending"],

            datasets: [{

                data: [65,25,10],

                backgroundColor: [

                    "#ef4444",

                    "#22c55e",

                    "#f59e0b"

                ]

            }]

        },

        options: {

            responsive: true

        }

    });

}