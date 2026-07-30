// ==========================================
// FinGuard AI - app.js
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("FinGuard AI Loaded Successfully");

    // ==========================================
    // KPI Counter Animation
    // ==========================================

    document.querySelectorAll(".kpi-grid h2").forEach(counter => {

        let text = counter.innerText;

        let target = parseInt(text.replace(/[^\d]/g, ""));

        if (isNaN(target)) return;

        let prefix = "";

        if (text.includes("₹")) {
            prefix = "₹";
        }

        let current = 0;

        let increment = Math.ceil(target / 80);

        let interval = setInterval(function () {

            current += increment;

            if (current >= target) {

                current = target;

                clearInterval(interval);

            }

            counter.innerText = prefix + current.toLocaleString("en-IN");

        }, 20);

    });


    // ==========================================
    // Button Hover Effect
    // ==========================================

    document.querySelectorAll(".btn-primary").forEach(button => {

        button.addEventListener("mouseenter", function () {

            button.style.transform = "translateY(-2px) scale(1.02)";

        });

        button.addEventListener("mouseleave", function () {

            button.style.transform = "translateY(0)";

        });

    });


    // ==========================================
    // Search Filter
    // ==========================================

    const search = document.querySelector(".search");

    if (search) {

        search.addEventListener("keyup", function () {

            const value = search.value.toLowerCase();

            document.querySelectorAll("tbody tr").forEach(row => {

                if (row.innerText.toLowerCase().includes(value)) {

                    row.style.display = "";

                }

                else {

                    row.style.display = "none";

                }

            });

        });

    }


    // ==========================================
    // Transaction Chart
    // ==========================================

    const transactionCanvas = document.getElementById("transactionChart");

    if (transactionCanvas) {

        new Chart(transactionCanvas, {

            type: "line",

            data: {

                labels: [

                    "Jan",

                    "Feb",

                    "Mar",

                    "Apr",

                    "May",

                    "Jun",

                    "Jul"

                ],

                datasets: [

                    {

                        label: "Transactions",

                        data: [

                            150,

                            200,

                            270,

                            310,

                            420,

                            510,

                            640

                        ],

                        borderColor: "#2563eb",

                        backgroundColor: "rgba(37,99,235,0.15)",

                        fill: true,

                        tension: 0.4

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

                }

            }

        });

    }


    // ==========================================
    // Fraud Chart
    // ==========================================

    // ==========================================
// Fraud Chart (Updated Doughnut)
// ==========================================

const fraudCanvas = document.getElementById("fraudChart");

if (fraudCanvas) {

    new Chart(fraudCanvas, {

        type: "doughnut",

        data: {

            labels: [

                "Safe",

                "Suspicious",

                "Fraud"

            ],

            datasets: [

                {

                    data: [

                        88,

                        8,

                        4

                    ],

                    backgroundColor: [

                        "#10b981",

                        "#f59e0b",

                        "#ef4444"

                    ],

                    borderWidth: 0

                }

            ]

        },


        options: {

            responsive:true,

            maintainAspectRatio:false,


            cutout:"65%",


            plugins:{

                legend:{

                    position:"bottom",

                    labels:{

                        color:"#ffffff",

                        padding:20,

                        font:{

                            size:14,

                            weight:"600"

                        }

                    }

                }

            }

        }

    });

}

    // ==========================================
    // Fade In Animation
    // ==========================================

    const cards = document.querySelectorAll(".card");

    cards.forEach(function (card, index) {

        card.style.opacity = 0;

        card.style.transform = "translateY(30px)";

        setTimeout(function () {

            card.style.transition = ".5s";

            card.style.opacity = 1;

            card.style.transform = "translateY(0px)";

        }, index * 150);

    });


    // ==========================================
    // Notification Button
    // ==========================================

    const bell = document.querySelector(".bi-bell");

    if (bell) {

        bell.addEventListener("click", function () {

            alert("No new notifications.");

        });

    }


    // ==========================================
    // Theme Toggle
    // ==========================================

    const moon = document.querySelector(".bi-moon-stars");

    if (moon) {

        moon.addEventListener("click", function () {

            document.body.classList.toggle("light-mode");

        });

    }


    // ==========================================
    // Sidebar Active Menu
    // ==========================================

    const links = document.querySelectorAll(".menu a");

    links.forEach(function (link) {

        link.addEventListener("click", function () {

            links.forEach(l => l.classList.remove("active"));

            this.classList.add("active");

        });

    });


    // ==========================================
    // Hero Button
    // ==========================================

    // ==========================================
// Hero Button - Run AI Analysis
// ==========================================

const heroButton = document.querySelector(".hero button");

if (heroButton) {

    heroButton.addEventListener("click", async function () {

        heroButton.disabled = true;
        heroButton.innerText = "Analyzing...";

        const transaction = {
            amount: 98000,
            merchant: "Crypto Exchange",
            location: "Russia",
            time: "03:15",
            card_type: "Debit Card"
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

            alert(
                "Risk Score : " + data.analysis.risk_score +
                "\nStatus : " + data.analysis.fraud_status +
                "\nReason : " + data.analysis.reason +
                "\nRecommendation : " + data.analysis.recommendation
            );

        } catch (error) {

            console.error(error);
            alert("Server Error");

        }

        heroButton.disabled = false;
        heroButton.innerText = "Run AI Analysis";

    });

}

    }

);

console.log("FinGuard AI JavaScript Loaded.");
// Top Risk Users
document.querySelectorAll(".mini-table tbody tr").forEach(row=>{
    row.style.cursor="pointer";

    row.addEventListener("click",function(){
        const user=this.cells[0].innerText;
        alert("Opening profile of "+user);

        // window.location.href="/user/"+user;
    });
});

// Fraud Cases
document.querySelectorAll(".case-item").forEach(card=>{
    card.style.cursor="pointer";

    card.addEventListener("click",function(){

        const id=this.querySelector("strong").innerText;

        alert("Opening "+id);

        // window.location.href="/case/"+id;
    });
});

// AI Insights
document.querySelectorAll(".insight-item").forEach(card=>{

    card.style.cursor="pointer";

    card.addEventListener("click",function(){

        const title=this.querySelector("h4").innerText;

        alert(title);

    });

});