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

                responsive: true,

                plugins: {

                    legend: {

                        position: "bottom",

                        labels: {

                            color: "white"

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

    const heroButton = document.querySelector(".hero button");

    if (heroButton) {

        heroButton.addEventListener("click", function () {

            alert("AI Analysis Started Successfully!");

        });

    }

});

console.log("FinGuard AI JavaScript Loaded.");