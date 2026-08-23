/* ==========================================================
   FinGuard AI Dashboard
   FINAL CLEAN dashboard.js

   - Single initialization flow
   - Single 3D AI Core
   - Single live dashboard loader
   - Single Potential Fraud loader
   - Single Recent Transactions loader
   - Backend AI insights preserved
   - Model accuracy separated from risk score
   - Robust API field handling
   ========================================================== */

"use strict";


/* ==========================================================
   GLOBAL CONFIG
   ========================================================== */

const DASHBOARD_CONFIG = {

    summaryEndpoint: "/dashboard/summary",

    liveEndpoint: "/api/dashboard-live",

    fraudEndpoint: "/dashboard/fraud-detection",

    recentEndpoint: "/api/recent-transactions",

    trendEndpoint: "/dashboard/trend",

    riskEndpoint: "/dashboard/risk",

    insightEndpoint: "/dashboard/ai-insight",

    modelPerformanceEndpoint: "/api/model-performance",

    liveRefreshInterval: 30000,

    toastInterval: 12000,

    insightInterval: 7000

};


/* ==========================================================
   DOM HELPERS
   ========================================================== */

function getElement(id) {

    return document.getElementById(id);

}


function setText(id, value) {

    const element = getElement(id);

    if (element) {

        element.innerText =
            value ?? "";

    }

}


function safeNumber(value, fallback = 0) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;

}


function formatNumber(value) {

    return safeNumber(value)
        .toLocaleString("en-IN");

}


function formatPercentage(value, decimals = 1) {

    const number = safeNumber(value);

    return number.toFixed(decimals) + "%";

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ==========================================================
   API HELPER
   ========================================================== */

async function fetchJSON(url, options = {}) {

    const response = await fetch(url, {

        ...options,

        headers: {

            "Accept": "application/json",

            ...(options.headers || {})

        }

    });


    if (!response.ok) {

        throw new Error(
            `${url} failed: ${response.status}`
        );

    }


    return await response.json();

}


/* ==========================================================
   LIVE CLOCK
   ========================================================== */

function initClock() {

    const element =
        getElement("currentTime");

    if (!element) return;


    function updateClock() {

        const now = new Date();


        element.innerText =
            now.toLocaleTimeString([], {

                hour: "2-digit",

                minute: "2-digit",

                second: "2-digit"

            });

    }


    updateClock();


    setInterval(
        updateClock,
        1000
    );

}


/* ==========================================================
   COUNTER
   ========================================================== */

function counter(id, target) {

    const element =
        getElement(id);

    if (!element) return;


    target =
        safeNumber(target);


    let value = 0;


    const speed =
        Math.max(
            1,
            Math.floor(target / 80)
        );


    const timer =
        setInterval(() => {

            value += speed;


            if (value >= target) {

                value = target;

                clearInterval(timer);

            }


            element.innerText =
                formatNumber(value);

        }, 20);

}


/* ==========================================================
   SIDEBAR
   ========================================================== */

function initSidebar() {

    const menuBtn =
        document.querySelector(".menu-btn");

    const sidebar =
        document.querySelector(".sidebar");


    if (!menuBtn || !sidebar) return;


    menuBtn.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "collapsed"
            );

        }
    );

}


/* ==========================================================
   DARK MODE
   ========================================================== */

function initTheme() {

    const themeIcon =
        document.querySelector(".fa-moon");


    if (!themeIcon) return;


    const button =
        themeIcon.parentElement;


    if (!button) return;


    button.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "light-mode"
            );

        }
    );

}


/* ==========================================================
   RIPPLE EFFECT
   ========================================================== */

function initRippleEffect() {

    document
        .querySelectorAll(
            "button, .primary-btn, .action-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                function (event) {

                    const rect =
                        this.getBoundingClientRect();


                    const size =
                        Math.max(
                            rect.width,
                            rect.height
                        );


                    const ripple =
                        document.createElement(
                            "span"
                        );


                    ripple.style.width =
                        size + "px";


                    ripple.style.height =
                        size + "px";


                    ripple.style.left =
                        (
                            event.clientX -
                            rect.left -
                            size / 2
                        ) + "px";


                    ripple.style.top =
                        (
                            event.clientY -
                            rect.top -
                            size / 2
                        ) + "px";


                    ripple.className =
                        "ripple";


                    this.appendChild(
                        ripple
                    );


                    setTimeout(
                        () => ripple.remove(),
                        600
                    );

                }
            );

        });

}


/* ==========================================================
   FADE IN
   ========================================================== */

function initFadeAnimation() {

    if (
        typeof IntersectionObserver ===
        "undefined"
    ) {
        return;
    }


    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target
                                .classList
                                .add("show");

                        }

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".glass-card, .stat-card, .hero-left, .hero-right"
        )
        .forEach(card => {

            card.classList.add(
                "hidden"
            );

            observer.observe(card);

        });

}


/* ==========================================================
   DASHBOARD SUMMARY
   ========================================================== */

async function loadDashboard() {

    try {

        const data =
            await fetchJSON(
                DASHBOARD_CONFIG.summaryEndpoint
            );


        console.log(
            "Dashboard Summary:",
            data
        );


        const total =
            safeNumber(
                data.total_transactions
            );


        const fraud =
            safeNumber(
                data.fraud_transactions
            );


        const highRisk =
            safeNumber(
                data.high_risk_transactions
            );


        const mediumRisk =
            safeNumber(
                data.medium_risk_transactions
            );


        const safeTransactions =
            data.safe_transactions !== undefined

                ? safeNumber(
                    data.safe_transactions
                )

                : Math.max(
                    0,
                    total - fraud
                );


        setText(
            "totalTransactions",
            formatNumber(total)
        );


        setText(
            "highRisk",
            formatNumber(highRisk)
        );


        setText(
            "mediumRisk",
            formatNumber(mediumRisk)
        );


        setText(
            "safeTransactions",
            formatNumber(safeTransactions)
        );


    }
    catch (error) {

        console.error(
            "Dashboard Summary Error:",
            error
        );

    }

}


/* ==========================================================
   MODEL PERFORMANCE
   ========================================================== */

async function loadModelPerformance() {

    try {

        const data =
            await fetchJSON(
                DASHBOARD_CONFIG
                    .modelPerformanceEndpoint
            );


        console.log(
            "Model Performance:",
            data
        );


        let accuracy =
            safeNumber(
                data.accuracy
            );


        /*
         * Backend usually returns:
         *
         * accuracy = 0.9982
         *
         * Convert to:
         *
         * 99.82%
         */

        if (
            accuracy > 0 &&
            accuracy <= 1
        ) {

            accuracy *= 100;

        }


        /*
         * If backend already returns:
         *
         * 99.82
         *
         * keep it unchanged.
         */


        const accuracyText =
            formatPercentage(
                accuracy,
                2
            );


        setText(
            "dashboardAccuracy",
            accuracyText
        );


        /*
         * AI Performance first item
         */

        const performanceItems =
            document.querySelectorAll(
                ".performance-item h2"
            );


        if (
            performanceItems.length >= 1
        ) {

            performanceItems[0]
                .innerText =
                accuracyText;

        }


        /*
         * Other possible accuracy elements
         */

        setText(
            "aiAccuracy",
            accuracyText
        );


        setText(
            "coreAccuracy",
            accuracyText
        );


        console.log(
            "Final Model Accuracy:",
            accuracyText
        );

    }
    catch (error) {

        console.error(
            "Model Performance Error:",
            error
        );

    }

}


/* ==========================================================
   LIVE DASHBOARD
   ========================================================== */

async function loadDashboardLive() {

    try {

        const data =
            await fetchJSON(
                DASHBOARD_CONFIG.liveEndpoint
            );


        console.log(
            "Live Dashboard:",
            data
        );


        const performance =
            data.performance || {};


        /*
         * Detection accuracy
         *
         * IMPORTANT:
         * Do NOT use average risk score here.
         */

        if (
            performance.detection_rate !==
            undefined
        ) {

            let detection =
                safeNumber(
                    performance.detection_rate
                );


            if (
                detection > 0 &&
                detection <= 1
            ) {

                detection *= 100;

            }


            setText(
                "dashboardAccuracy",
                formatPercentage(
                    detection,
                    2
                )
            );

        }


        /*
         * Average Risk Score
         */

        const averageRisk =
            safeNumber(
                performance.average_risk_score
            );


        setText(
            "avgDetection",
            averageRisk.toFixed(1)
        );


        /*
         * Performance cards
         */

        const performanceItems =
            document.querySelectorAll(
                ".performance-item h2"
            );


        if (
            performanceItems.length >= 4
        ) {

            /*
             * Item 1 = Accuracy
             */

            if (
                performance.detection_rate !==
                undefined
            ) {

                let accuracy =
                    safeNumber(
                        performance.detection_rate
                    );


                if (
                    accuracy > 0 &&
                    accuracy <= 1
                ) {

                    accuracy *= 100;

                }


                performanceItems[0]
                    .innerText =
                    formatPercentage(
                        accuracy,
                        2
                    );

            }


            /*
             * Item 2 = Average Risk Score
             */

            if (
                performance.average_risk_score !==
                undefined
            ) {

                performanceItems[1]
                    .innerText =
                    averageRisk.toFixed(1);

            }


            /*
             * Item 3 = Transactions
             */

            performanceItems[2]
                .innerText =
                formatNumber(
                    performance.total_transactions
                );


            /*
             * Item 4 = Frauds
             */

            performanceItems[3]
                .innerText =
                formatNumber(
                    performance.frauds_detected
                );

        }


        /*
         * AI Security Core
         */

        setText(
            "coreAccuracy",
            performance.detection_rate !==
                undefined
                ? formatPercentage(
                    performance.detection_rate,
                    2
                )
                : ""
        );


        setText(
            "coreThreats",
            formatNumber(
                performance.frauds_detected
            )
        );


        setText(
            "coreTransactions",
            formatNumber(
                performance.total_transactions
            )
        );


        /*
         * Live threat feed
         */

        renderThreatFeed(
            data.threats || []
        );


    }
    catch (error) {

        console.error(
            "Live Dashboard Error:",
            error
        );

    }

}


/* ==========================================================
   LIVE THREAT FEED
   ========================================================== */

function renderThreatFeed(threats) {

    const feed =
        document.querySelector(
            ".activity-list"
        );


    if (!feed) return;


    if (
        !Array.isArray(threats) ||
        threats.length === 0
    ) {

        feed.innerHTML = `

            <div class="activity success">

                <div class="dot green"></div>

                <div>

                    <strong>
                        System Secure
                    </strong>

                    <p>
                        No active threats detected
                    </p>

                </div>

            </div>

        `;

        return;

    }


    feed.innerHTML =
        threats.map(threat => {

            const merchant =
                escapeHTML(
                    threat.merchant ||
                    threat.merchant_name ||
                    "Unknown Merchant"
                );


            const amount =
                safeNumber(
                    threat.amount
                );


            const risk =
                escapeHTML(
                    threat.risk ||
                    threat.risk_level ||
                    "High"
                );


            const time =
                escapeHTML(
                    threat.time ||
                    ""
                );


            return `

                <div class="activity danger">

                    <div class="dot red"></div>

                    <div>

                        <strong>
                            ${merchant}
                        </strong>

                        <p>
                            ₹${formatNumber(amount)}
                            - ${risk} Risk
                        </p>

                        <small>
                            ${time}
                        </small>

                    </div>

                </div>

            `;

        }).join("");

}


/* ==========================================================
   AI INSIGHTS
   ========================================================== */

async function loadAIInsights() {

    try {

        const data =
            await fetchJSON(
                DASHBOARD_CONFIG
                    .insightEndpoint
            );


        console.log(
            "AI Insight:",
            data
        );


        const box =
            getElement(
                "aiInsights"
            );


        if (!box) return;


        /*
         * Backend says no analysis
         */

        if (data.message) {

            box.innerHTML = `

                <div class="insight info">

                    <i class="fa-solid fa-robot"></i>

                    <div>

                        <strong>
                            No AI Analysis
                        </strong>

                        <p>
                            ${escapeHTML(
                                data.message
                            )}
                        </p>

                    </div>

                </div>

            `;

            return;

        }


        const prediction =
            escapeHTML(
                data.prediction ||
                "AI Monitoring"
            );


        const riskLevel =
            escapeHTML(
                data.risk_level ||
                "Unknown"
            );


        const riskScore =
            safeNumber(
                data.risk_score
            );


        const fraudProbability =
            safeNumber(
                data.fraud_probability
            );


        const reason =
            escapeHTML(
                data.reason ||
                "No reason available."
            );


        const recommendation =
            escapeHTML(
                data.recommendation ||
                "Continue monitoring the transaction."
            );


        box.innerHTML = `

            <div class="insight warning">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <div>

                    <strong>
                        ${prediction}
                        (${riskLevel})
                    </strong>

                    <p>
                        Risk Score:
                        ${riskScore.toFixed(1)}%
                    </p>

                    <p>
                        Fraud Probability:
                        ${fraudProbability.toFixed(1)}%
                    </p>

                </div>

            </div>


            <div class="insight info">

                <i class="fa-solid fa-brain"></i>

                <div>

                    <strong>
                        AI Reason
                    </strong>

                    <p>
                        ${reason}
                    </p>

                </div>

            </div>


            <div class="insight success">

                <i class="fa-solid fa-shield-halved"></i>

                <div>

                    <strong>
                        Recommendation
                    </strong>

                    <p>
                        ${recommendation}
                    </p>

                </div>

            </div>

        `;

    }
    catch (error) {

        console.error(
            "AI Insight Error:",
            error
        );

    }

}


/* ==========================================================
   AI MONITORING STATUS
   ========================================================== */

function startAIStatus() {

    const box =
        getElement(
            "aiInsights"
        );


    if (!box) return;


    /*
     * IMPORTANT:
     *
     * Random monitoring messages should NOT
     * overwrite backend AI analysis.
     *
     * So we only update the status badge,
     * if available.
     */


    const statusElements =
        document.querySelectorAll(
            ".ai-status, .ai-monitoring-status"
        );


    statusElements.forEach(
        element => {

            element.innerText =
                "AI MONITORING";

        }
    );

}


/* ==========================================================
   RISK DISTRIBUTION CHART
   ========================================================== */

async function initRiskChart() {

    const canvas =
        getElement(
            "riskDistributionChart"
        );


    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {

        console.warn(
            "Risk chart unavailable."
        );

        return;

    }


    try {

        const data =
            await fetchJSON(
                DASHBOARD_CONFIG
                    .riskEndpoint
            );


        console.log(
            "Risk API Data:",
            data
        );


        const riskData = {

            High: 0,

            Medium: 0,

            Low: 0

        };


        if (
            Array.isArray(data)
        ) {

            data.forEach(item => {

                const level =
                    String(
                        item.risk_level ||
                        item.risk ||
                        ""
                    ).toLowerCase();


                const count =
                    safeNumber(
                        item.count
                    );


                if (
                    level.includes("high")
                ) {

                    riskData.High =
                        count;

                }
                else if (
                    level.includes("medium")
                ) {

                    riskData.Medium =
                        count;

                }
                else if (
                    level.includes("low") ||
                    level.includes("safe")
                ) {

                    riskData.Low =
                        count;

                }

            });

        }


        /*
         * Destroy old chart if necessary
         */

        if (
            canvas._finguardChart
        ) {

            canvas._finguardChart.destroy();

        }


        canvas._finguardChart =
            new Chart(canvas, {

                type: "doughnut",

                data: {

                    labels: [

                        "High Risk",

                        "Medium Risk",

                        "Low Risk"

                    ],

                    datasets: [{

                        data: [

                            riskData.High,

                            riskData.Medium,

                            riskData.Low

                        ],

                        backgroundColor: [

                            "#EF4444",

                            "#F59E0B",

                            "#22C55E"

                        ],

                        borderColor: [

                            "#ff7b7b",

                            "#ffd166",

                            "#4ade80"

                        ],

                        borderWidth: 2,

                        hoverOffset: 20

                    }]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    cutout: "75%",

                    animation: {

                        animateRotate: true,

                        duration: 1500

                    },

                    plugins: {

                        legend: {

                            position: "bottom",

                            labels: {

                                color: "#94A3B8",

                                padding: 20,

                                usePointStyle: true

                            }

                        }

                    }

                }

            });


    }
    catch (error) {

        console.error(
            "Risk Chart Error:",
            error
        );

    }

}


/* ==========================================================
   FRAUD TREND CHART
   ========================================================== */

async function initTrendChart() {

    const canvas =
        getElement(
            "fraudTrendChart"
        );


    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {

        return;

    }


    try {

        const trendData =
            await fetchJSON(
                DASHBOARD_CONFIG
                    .trendEndpoint
            );


        if (
            !Array.isArray(trendData)
        ) {

            return;

        }


        const labels =
            trendData.map(
                item =>
                    item.date || ""
            );


        const values =
            trendData.map(
                item =>
                    safeNumber(
                        item.transactions
                    )
            );


        if (
            canvas._finguardChart
        ) {

            canvas._finguardChart.destroy();

        }


        canvas._finguardChart =
            new Chart(canvas, {

                type: "line",

                data: {

                    labels,

                    datasets: [{

                        label:
                            "Transactions",

                        data:
                            values,

                        borderColor:
                            "#00D4FF",

                        backgroundColor:
                            "rgba(0,212,255,0.12)",

                        borderWidth: 3,

                        pointRadius: 4,

                        pointHoverRadius: 8,

                        pointBackgroundColor:
                            "#00D4FF",

                        pointBorderColor:
                            "#ffffff",

                        pointBorderWidth: 2,

                        fill: true,

                        tension: 0.45

                    }]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    animation: {

                        duration: 1500,

                        easing: "easeOutQuart"

                    },

                    plugins: {

                        legend: {

                            labels: {

                                color:
                                    "#94A3B8"

                            }

                        }

                    },

                    scales: {

                        x: {

                            ticks: {

                                color:
                                    "#94A3B8"

                            },

                            grid: {

                                display: false

                            }

                        },

                        y: {

                            ticks: {

                                color:
                                    "#94A3B8"

                            },

                            grid: {

                                color:
                                    "rgba(148,163,184,0.12)"

                            }

                        }

                    }

                }

            });

    }
    catch (error) {

        console.error(
            "Trend Chart Error:",
            error
        );

    }

}


/* ==========================================================
   AI RISK INTELLIGENCE CHART
   ========================================================== */

function initAIRiskChart() {

    const canvas =
        getElement(
            "aiRiskChart"
        );


    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {

        return;

    }


    if (
        canvas._finguardChart
    ) {

        canvas._finguardChart.destroy();

    }


    canvas._finguardChart =
        new Chart(canvas, {

            type: "line",

            data: {

                labels: [

                    "10 AM",

                    "11 AM",

                    "12 PM",

                    "1 PM",

                    "2 PM",

                    "3 PM"

                ],

                datasets: [{

                    label:
                        "AI Risk Score",

                    data: [

                        22,

                        35,

                        28,

                        65,

                        45,

                        30

                    ],

                    borderColor:
                        "#00D4FF",

                    backgroundColor:
                        "rgba(0,212,255,0.15)",

                    borderWidth: 3,

                    fill: true,

                    tension: 0.45,

                    pointRadius: 5,

                    pointBackgroundColor:
                        "#00D4FF"

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        labels: {

                            color:
                                "#94A3B8"

                        }

                    }

                },

                scales: {

                    x: {

                        ticks: {

                            color:
                                "#64748B"

                        },

                        grid: {

                            display: false

                        }

                    },

                    y: {

                        beginAtZero: true,

                        max: 100,

                        ticks: {

                            color:
                                "#64748B"

                        },

                        grid: {

                            color:
                                "rgba(255,255,255,.05)"

                        }

                    }

                }

            }

        });

}


/* ==========================================================
   RECENT TRANSACTIONS
   ========================================================== */

async function loadRecentTransactions() {

    const tbody =
        getElement(
            "recentTransactionsBody"
        );


    if (!tbody) return;


    try {

        const response =
            await fetchJSON(
                DASHBOARD_CONFIG
                    .recentEndpoint,
                {
                    cache: "no-store"
                }
            );


        const transactions =
            Array.isArray(response)

                ? response

                : (
                    response.transactions ||
                    response.data ||
                    []
                );


        tbody.innerHTML = "";


        if (!transactions.length) {

            tbody.innerHTML = `

                <tr>

                    <td colspan="6">
                        No transactions found.
                    </td>

                </tr>

            `;

            return;

        }


        transactions.forEach(tx => {

            const transactionId =
                escapeHTML(
                    tx.transaction_id ||
                    tx.id ||
                    "Unknown"
                );


            const merchant =
                escapeHTML(
                    tx.merchant ||
                    tx.merchant_name ||
                    "Unknown Merchant"
                );


            const amount =
                safeNumber(
                    tx.amount
                );


            const risk =
                String(
                    tx.risk_level ||
                    tx.risk ||
                    "Low"
                );


            const riskLower =
                risk.toLowerCase();


            let badge =
                "low";


            if (
                riskLower.includes("high")
            ) {

                badge = "high";

            }
            else if (
                riskLower.includes("medium")
            ) {

                badge = "medium";

            }
            else if (
                riskLower.includes("low") ||
                riskLower.includes("safe")
            ) {

                badge = "low";

            }


            /*
             * IMPORTANT:
             *
             * AI Score field mapping
             *
             * Backend may use any of these.
             */

            let aiScore =
                tx.fraud_probability;


            if (
                aiScore === undefined ||
                aiScore === null ||
                aiScore === ""
            ) {

                aiScore =
                    tx.fraud_probability_score;

            }


            if (
                aiScore === undefined ||
                aiScore === null ||
                aiScore === ""
            ) {

                aiScore =
                    tx.fraud_score;

            }


            if (
                aiScore === undefined ||
                aiScore === null ||
                aiScore === ""
            ) {

                aiScore =
                    tx.fraud_score_percent;

            }


            if (
                aiScore === undefined ||
                aiScore === null ||
                aiScore === ""
            ) {

                aiScore =
                    tx.probability;

            }


            if (
                aiScore === undefined ||
                aiScore === null ||
                aiScore === ""
            ) {

                aiScore =
                    tx.risk_score;

            }


            aiScore =
                safeNumber(
                    aiScore
                );


            const prediction =
                escapeHTML(
                    tx.prediction ||
                    (
                        riskLower.includes("high")
                            ? "Fraud"
                            : "Safe"
                    )
                );


            tbody.innerHTML += `

                <tr>

                    <td>
                        ${transactionId}
                    </td>

                    <td>
                        ${merchant}
                    </td>

                    <td>
                        ₹${formatNumber(amount)}
                    </td>

                    <td>

                        <span
                            class="badge ${badge}"
                        >

                            ${escapeHTML(risk)}

                        </span>

                    </td>

                    <td>
                        ${prediction}
                    </td>

                    <td>
                        ${aiScore.toFixed(1)}%
                    </td>

                </tr>

            `;

        });


    }
    catch (error) {

        console.error(
            "Recent Transactions Error:",
            error
        );


        tbody.innerHTML = `

            <tr>

                <td colspan="6">
                    Unable to load transactions.
                </td>

            </tr>

        `;

    }

}


/* ==========================================================
   POTENTIAL FRAUD DETECTION
   ========================================================== */

async function loadPotentialFraud() {

    const container =
        getElement(
            "potentialFraudList"
        );


    if (!container) return;


    try {

        const data =
            await fetchJSON(
                DASHBOARD_CONFIG
                    .fraudEndpoint,
                {
                    cache: "no-store"
                }
            );


        console.log(
            "Potential Fraud API:",
            data
        );


        let transactions = [];


        if (
            Array.isArray(data.alerts)
        ) {

            transactions =
                data.alerts;

        }
        else if (
            Array.isArray(data.transactions)
        ) {

            transactions =
                data.transactions;

        }
        else if (
            Array.isArray(data)
        ) {

            transactions =
                data;

        }


        if (!transactions.length) {

            container.innerHTML = `

                <div class="fraud-empty">

                    <i
                        class="fa-solid fa-shield-check"
                    ></i>

                    <div>

                        <strong>
                            System Secure
                        </strong>

                        <p>
                            No suspicious
                            transactions detected.
                        </p>

                    </div>

                </div>

            `;

            return;

        }


        container.innerHTML =
            transactions.map(
                transaction =>
                    renderFraudItem(
                        transaction
                    )
            ).join("");


    }
    catch (error) {

        console.error(
            "Potential Fraud Error:",
            error
        );


        container.innerHTML = `

            <div class="fraud-empty">

                <i
                    class="fa-solid fa-triangle-exclamation"
                ></i>

                <div>

                    <strong>
                        Fraud Intelligence
                        Unavailable
                    </strong>

                    <p>
                        Unable to load
                        transaction risk data.
                    </p>

                </div>

            </div>

        `;

    }

}


/* ==========================================================
   RENDER FRAUD ITEM
   ========================================================== */

function renderFraudItem(transaction) {

    const transactionId =
        String(
            transaction.transaction_id ||
            transaction.id ||
            "Unknown"
        );


    const merchant =
        escapeHTML(
            transaction.merchant ||
            transaction.merchant_name ||
            "Unknown Merchant"
        );


    const amount =
        safeNumber(
            transaction.amount
        );


    const riskLevel =
        String(
            transaction.risk_level ||
            transaction.risk ||
            "Medium"
        );


    const riskClass =
        riskLevel
            .toLowerCase()
            .replace(/\s+/g, "-");


    /*
     * Risk Score
     */

    let riskScore =
        transaction.risk_score;


    if (
        riskScore === undefined ||
        riskScore === null ||
        riskScore === ""
    ) {

        riskScore =
            transaction.riskScore;

    }


    if (
        riskScore === undefined ||
        riskScore === null ||
        riskScore === ""
    ) {

        riskScore =
            transaction.score;

    }


    /*
     * Fraud Probability
     */

    let fraudProbability =
        transaction.fraud_probability;


    if (
        fraudProbability === undefined ||
        fraudProbability === null ||
        fraudProbability === ""
    ) {

        fraudProbability =
            transaction.fraudProbability;

    }


    if (
        fraudProbability === undefined ||
        fraudProbability === null ||
        fraudProbability === ""
    ) {

        fraudProbability =
            transaction.fraud_probability_score;

    }


    if (
        fraudProbability === undefined ||
        fraudProbability === null ||
        fraudProbability === ""
    ) {

        fraudProbability =
            transaction.fraud_score;

    }


    if (
        fraudProbability === undefined ||
        fraudProbability === null ||
        fraudProbability === ""
    ) {

        fraudProbability =
            transaction.probability;

    }


    riskScore =
        safeNumber(
            riskScore,
            safeNumber(
                fraudProbability
            )
        );


    fraudProbability =
        safeNumber(
            fraudProbability,
            riskScore
        );


    return `

        <div class="fraud-item">

            <div class="fraud-transaction">

                <strong>
                    ${escapeHTML(transactionId)}
                </strong>

                <small>
                    ${merchant}
                </small>

            </div>


            <div class="fraud-value">

                ₹${formatNumber(amount)}

            </div>


            <div>

                <span
                    class="fraud-risk ${riskClass}"
                >

                    ${escapeHTML(riskLevel)}

                </span>

            </div>


            <div class="fraud-value">

                Score:
                ${riskScore.toFixed(1)}

            </div>


            <div class="fraud-probability">

                ${fraudProbability.toFixed(1)}%

            </div>


            <button
                class="fraud-action"
                type="button"
                data-transaction-id="${escapeHTML(transactionId)}"
            >

                Investigate

            </button>

        </div>

    `;

}


/* ==========================================================
   FRAUD INVESTIGATION
   ========================================================== */

function inspectFraud(transactionId) {

    if (!transactionId) {
        showToast(
            "Transaction ID missing.",
            "error"
        );
        return;
    }

    const id = String(transactionId).trim();

    if (!id) {
        showToast(
            "Invalid transaction ID.",
            "error"
        );
        return;
    }

    console.log(
        "Opening transaction investigation:",
        id
    );

    /*
     * Directly open the investigation page.
     * Do not call /transactions/{id} first.
     */

    window.location.href =
        `/transaction/${encodeURIComponent(id)}`;
}
/* ==========================================================
   INVESTIGATION BUTTON EVENTS
   ========================================================== */

function initFraudButtons() {

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".fraud-action"
                );


            if (!button) return;


            const transactionId =
                button.dataset
                    .transactionId;


            inspectFraud(
                transactionId
            );

        }
    );

}


/* ==========================================================
   TOAST
   ========================================================== */

function showToast(
    message,
    type = "info"
) {

    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast ${type}`;


    toast.innerHTML = `

        <i
            class="fa-solid fa-bell"
        ></i>

        <span>
            ${escapeHTML(message)}
        </span>

    `;


    document.body.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.classList.add(
                "show"
            );

        },
        100
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );


            setTimeout(
                () => toast.remove(),
                400
            );

        },
        4000
    );

}


/* ==========================================================
   OPTIONAL LIVE SYSTEM TOASTS
   ========================================================== */

function startLiveToasts() {

    const alerts = [

        "🟢 AI Model Updated Successfully",

        "🔍 Suspicious Merchant Found",

        "💳 New Transaction Received",

        "🧠 AI Fraud Scan Completed",

        "✅ System Running Normally"

    ];


    setInterval(
        () => {

            const message =
                alerts[
                    Math.floor(
                        Math.random() *
                        alerts.length
                    )
                ];


            showToast(
                message,
                "info"
            );

        },
        DASHBOARD_CONFIG.toastInterval
    );

}


/* ==========================================================
   3D AI SECURITY CORE
   ========================================================== */

let ai3DInitialized = false;


function initAI3D() {

    const container =
        getElement(
            "ai3DScene"
        );


    if (!container) {

        console.log(
            "3D container not found."
        );

        return;

    }


    if (
        typeof THREE === "undefined"
    ) {

        console.warn(
            "Three.js is not loaded."
        );

        return;

    }


    /*
     * Prevent duplicate renderer.
     */

    if (ai3DInitialized) {

        return;

    }


    ai3DInitialized = true;


    console.log(
        "Starting FinGuard 3D Core..."
    );


    const width =
        container.clientWidth || 500;


    const height =
        container.clientHeight || 400;


    /* ======================================================
       SCENE
       ====================================================== */

    const scene =
        new THREE.Scene();


    scene.background =
        new THREE.Color(
            0x06111f
        );


    scene.fog =
        new THREE.FogExp2(
            0x06111f,
            0.0018
        );


    /* ======================================================
       CAMERA
       ====================================================== */

    const camera =
        new THREE.PerspectiveCamera(
            45,
            width / height,
            0.1,
            100
        );


    camera.position.set(
        0,
        0,
        6
    );


    /* ======================================================
       RENDERER
       ====================================================== */

    const renderer =
        new THREE.WebGLRenderer({

            antialias: true,

            alpha: true

        });


    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            2
        )
    );


    renderer.setSize(
        width,
        height
    );


    /*
     * Compatibility with different Three.js versions.
     */

    if (
        "outputColorSpace" in renderer &&
        THREE.SRGBColorSpace
    ) {

        renderer.outputColorSpace =
            THREE.SRGBColorSpace;

    }
    else if (
        "outputEncoding" in renderer &&
        THREE.sRGBEncoding
    ) {

        renderer.outputEncoding =
            THREE.sRGBEncoding;

    }


    container.innerHTML = "";


    container.appendChild(
        renderer.domElement
    );


    /* ======================================================
       LIGHTS
       ====================================================== */

    const ambientLight =
        new THREE.AmbientLight(
            0x66ccff,
            1.5
        );


    scene.add(
        ambientLight
    );


    const pointLight =
        new THREE.PointLight(
            0x00d4ff,
            4,
            10
        );


    pointLight.position.set(
        0,
        2,
        3
    );


    scene.add(
        pointLight
    );


    /* ======================================================
       CORE GROUP
       ====================================================== */

    const coreGroup =
        new THREE.Group();


    scene.add(
        coreGroup
    );


    /* ======================================================
       MAIN CORE
       ====================================================== */

    const coreGeometry =
        new THREE.IcosahedronGeometry(
            1.25,
            2
        );


    const coreMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x1597ff,

            emissive: 0x0066ff,

            emissiveIntensity: 1.8,

            metalness: 0.7,

            roughness: 0.2,

            wireframe: true

        });


    const core =
        new THREE.Mesh(
            coreGeometry,
            coreMaterial
        );


    coreGroup.add(
        core
    );


    /* ======================================================
       INNER CORE
       ====================================================== */

    const innerGeometry =
        new THREE.IcosahedronGeometry(
            0.75,
            2
        );


    const innerMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x00d4ff,

            emissive: 0x00d4ff,

            emissiveIntensity: 3,

            metalness: 0.3,

            roughness: 0.1

        });


    const innerCore =
        new THREE.Mesh(
            innerGeometry,
            innerMaterial
        );


    coreGroup.add(
        innerCore
    );


    /* ======================================================
       RINGS
       ====================================================== */

    const ringGroup =
        new THREE.Group();


    coreGroup.add(
        ringGroup
    );


    for (
        let i = 0;
        i < 3;
        i++
    ) {

        const ringGeometry =
            new THREE.TorusGeometry(
                1.55 + i * 0.18,
                0.025,
                16,
                100
            );


        const ringMaterial =
            new THREE.MeshBasicMaterial({

                color:
                    i === 1
                        ? 0x00d4ff
                        : 0x4f8cff,

                transparent: true,

                opacity: 0.75

            });


        const ring =
            new THREE.Mesh(
                ringGeometry,
                ringMaterial
            );


        ring.rotation.x =
            Math.PI / 2;


        ring.rotation.z =
            i * 0.8;


        ringGroup.add(
            ring
        );

    }


    /* ======================================================
       PARTICLES
       ====================================================== */

    const particleCount =
        700;


    const positions =
        new Float32Array(
            particleCount * 3
        );


    for (
        let i = 0;
        i < particleCount;
        i++
    ) {

        const radius =
            2.2 +
            Math.random() * 2.5;


        const theta =
            Math.random() *
            Math.PI *
            2;


        const phi =
            Math.acos(
                2 *
                Math.random() -
                1
            );


        positions[i * 3] =
            radius *
            Math.sin(phi) *
            Math.cos(theta);


        positions[i * 3 + 1] =
            radius *
            Math.sin(phi) *
            Math.sin(theta);


        positions[i * 3 + 2] =
            radius *
            Math.cos(phi);

    }


    const particleGeometry =
        new THREE.BufferGeometry();


    particleGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(
            positions,
            3
        )
    );


    const particleMaterial =
        new THREE.PointsMaterial({

            color: 0x00d4ff,

            size: 0.025,

            transparent: true,

            opacity: 0.8,

            sizeAttenuation: true

        });


    const particles =
        new THREE.Points(
            particleGeometry,
            particleMaterial
        );


    scene.add(
        particles
    );


    /* ======================================================
       MOUSE
       ====================================================== */

    let mouseX = 0;

    let mouseY = 0;


    container.addEventListener(
        "mousemove",
        event => {

            const rect =
                container
                    .getBoundingClientRect();


            mouseX =
                (
                    event.clientX -
                    rect.left
                ) /
                rect.width -
                0.5;


            mouseY =
                (
                    event.clientY -
                    rect.top
                ) /
                rect.height -
                0.5;

        }
    );


    /* ======================================================
       ANIMATION
       ====================================================== */

    const clock =
        new THREE.Clock();


    function animate() {

        requestAnimationFrame(
            animate
        );


        const time =
            clock.getElapsedTime();


        /*
         * Core
         */

        core.rotation.x =
            time * 0.25;


        core.rotation.y =
            time * 0.40;


        /*
         * Inner Core
         */

        innerCore.rotation.x =
            -time * 0.30;


        innerCore.rotation.y =
            -time * 0.50;


        /*
         * Rings
         */

        ringGroup.rotation.y =
            time * 0.35;


        ringGroup.rotation.x =
            Math.sin(
                time * 0.4
            ) * 0.3;


        /*
         * Particles
         */

        particles.rotation.y =
            time * 0.04;


        particles.rotation.x =
            time * 0.02;


        /*
         * Floating
         */

        const floating =
            Math.sin(
                time * 1.5
            ) * 0.08;


        coreGroup.position.y =
            floating;


        /*
         * Mouse Parallax
         */

        coreGroup.rotation.y +=
            (
                mouseX * 0.35 -
                coreGroup.rotation.y
            ) * 0.015;


        coreGroup.rotation.x +=
            (
                -mouseY * 0.25 -
                coreGroup.rotation.x
            ) * 0.015;


        renderer.render(
            scene,
            camera
        );

    }


    animate();


    /* ======================================================
       RESIZE
       ====================================================== */

    function resize3D() {

        const newWidth =
            container.clientWidth;


        const newHeight =
            container.clientHeight;


        if (
            !newWidth ||
            !newHeight
        ) {

            return;

        }


        camera.aspect =
            newWidth /
            newHeight;


        camera.updateProjectionMatrix();


        renderer.setSize(
            newWidth,
            newHeight
        );

    }


    window.addEventListener(
        "resize",
        resize3D
    );


    resize3D();


    console.log(
        "FinGuard 3D Core Started."
    );

}


/* ==========================================================
   SYNC AI SECURITY CORE WITH FRAUD API
   ========================================================== */

async function updateAISecurityCoreData() {

    try {

        const data =
            await fetchJSON(
                DASHBOARD_CONFIG
                    .fraudEndpoint,
                {
                    cache: "no-store"
                }
            );


        const alerts =
            Array.isArray(data.alerts)
                ? data.alerts
                : [];


        const totalTransactions =
            safeNumber(
                data.total_transactions
            );


        const fraudsDetected =
            safeNumber(
                data.fraud_transactions ||
                data.high_risk_transactions ||
                alerts.length
            );


        /*
         * IMPORTANT:
         *
         * coreAccuracy should represent model/detection
         * accuracy, NOT average risk score.
         */

        if (
            data.accuracy !== undefined
        ) {

            let accuracy =
                safeNumber(
                    data.accuracy
                );


            if (
                accuracy > 0 &&
                accuracy <= 1
            ) {

                accuracy *= 100;

            }


            setText(
                "coreAccuracy",
                formatPercentage(
                    accuracy,
                    2
                )
            );

        }


        setText(
            "coreThreats",
            formatNumber(
                fraudsDetected
            )
        );


        setText(
            "coreTransactions",
            formatNumber(
                totalTransactions
            )
        );


    }
    catch (error) {

        console.error(
            "AI Security Core Data Error:",
            error
        );

    }

}


/* ==========================================================
   LIVE DATA REFRESH
   ========================================================== */

async function refreshDashboard() {

    await Promise.allSettled([

        loadDashboard(),

        loadDashboardLive(),

        loadRecentTransactions(),

        loadPotentialFraud(),

        loadAIInsights(),

        initRiskChart(),

        initTrendChart()

    ]);

}


/* ==========================================================
   RUN AI ANALYSIS BUTTON
   ========================================================== */

function initAnalysisButton() {

    const buttons =
        document.querySelectorAll(
            ".run-ai-analysis, #runAIAnalysis"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                async () => {

                    button.disabled =
                        true;


                    const originalText =
                        button.innerText;


                    button.innerText =
                        "Analyzing...";


                    try {

                        await loadAIInsights();

                        await loadPotentialFraud();

                        await loadRecentTransactions();

                        showToast(
                            "AI fraud analysis completed.",
                            "success"
                        );

                    }
                    catch (error) {

                        console.error(
                            "AI Analysis Error:",
                            error
                        );


                        showToast(
                            "AI analysis failed.",
                            "error"
                        );

                    }
                    finally {

                        button.disabled =
                            false;


                        button.innerText =
                            originalText;

                    }

                }
            );

        }
    );

}


/* ==========================================================
   INITIALIZE DASHBOARD
   ========================================================== */

let dashboardInitialized =
    false;


async function initializeDashboard() {

    if (
        dashboardInitialized
    ) {

        return;

    }


    dashboardInitialized =
        true;


    console.log(
        "FinGuard Dashboard Initializing..."
    );


    /*
     * Basic UI
     */

    initClock();

    initSidebar();

    initTheme();

    initRippleEffect();

    initFadeAnimation();

    initFraudButtons();

    initAnalysisButton();


    /*
     * AI status
     */

    startAIStatus();


    /*
     * 3D
     */

    initAI3D();


    /*
     * Static chart
     */

    initAIRiskChart();


    /*
     * Load dashboard APIs
     */

    await Promise.allSettled([

        loadDashboard(),

        loadDashboardLive(),

        loadAIInsights(),

        loadPotentialFraud(),

        loadRecentTransactions(),

        loadModelPerformance(),

        updateAISecurityCoreData(),

        initRiskChart(),

        initTrendChart()

    ]);


    /*
     * Periodic refresh
     */

    setInterval(
        async () => {

            await Promise.allSettled([

                loadDashboard(),

                loadDashboardLive(),

                loadPotentialFraud(),

                loadRecentTransactions(),

                initRiskChart(),

                initTrendChart()

            ]);

        },
        DASHBOARD_CONFIG
            .liveRefreshInterval
    );


    console.log(
        "FinGuard Dashboard Ready."
    );

}


/* ==========================================================
   DOM READY
   ========================================================== */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeDashboard,
        {
            once: true
        }
    );

}
else {

    initializeDashboard();

}


/* ==========================================================
   GLOBAL FUNCTIONS
   ========================================================== */

window.inspectFraud =
    inspectFraud;


window.showToast =
    showToast;


window.loadDashboard =
    loadDashboard;


window.loadDashboardLive =
    loadDashboardLive;


window.loadRecentTransactions =
    loadRecentTransactions;


window.loadPotentialFraud =
    loadPotentialFraud;


window.loadAIInsights =
    loadAIInsights;


window.initAI3D =
    initAI3D;


window.initRiskChart =
    initRiskChart;


window.initTrendChart =
    initTrendChart;


window.initAIRiskChart =
    initAIRiskChart;


console.log(
    "FinGuard AI Dashboard JS Loaded."
);