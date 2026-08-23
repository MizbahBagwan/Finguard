/* =========================================================
   FINGUARD AI
   REPORTS PAGE
   COMPLETE WORKING JAVASCRIPT
========================================================= */

"use strict";


/* =========================================================
   GLOBAL DATA
========================================================= */

let reportsData = [];
let transactionsData = [];
let isLoading = false;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    initializeReportsPage();

});


/* =========================================================
   INITIALIZE REPORTS PAGE
========================================================= */

async function initializeReportsPage() {

    setDefaultDates();

    await loadReportsDashboard();

    await loadModelAccuracy();

    attachReportActions();

}


/* =========================================================
   DEFAULT DATES
========================================================= */

function setDefaultDates() {

    const startDate =
        document.getElementById("startDate");

    const endDate =
        document.getElementById("endDate");

    const today = new Date();

    if (endDate) {

        endDate.value =
            formatDate(today);

    }

    if (startDate) {

        const previous =
            new Date(today);

        previous.setDate(
            previous.getDate() - 30
        );

        startDate.value =
            formatDate(previous);

    }

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


/* =========================================================
   MAIN DASHBOARD LOAD
========================================================= */

async function loadReportsDashboard() {

    if (isLoading) {
        return;
    }

    isLoading = true;

    try {

        showLoadingState();

        await Promise.all([
            loadTransactions(),
            loadReports()
        ]);

        updateStatistics();

        updateRiskOverview();

        updateAIInsights();

        renderReportsTable();

    }
    catch (error) {

        console.error(
            "Reports dashboard error:",
            error
        );

        showReportMessage(
            "Unable to load report data.",
            "error"
        );

    }
    finally {

        isLoading = false;

        hideLoadingState();

    }

}


/* =========================================================
   LOAD TRANSACTIONS
========================================================= */

async function loadTransactions() {

    try {

        const response =
            await fetch(
                "/api/transactions",
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    },
                    cache: "no-store"
                }
            );

        if (!response.ok) {

            throw new Error(
                `Transaction API failed: ${response.status}`
            );

        }

        const data =
            await response.json();

        if (Array.isArray(data)) {

            transactionsData = data;

        }
        else if (
            Array.isArray(data.transactions)
        ) {

            transactionsData =
                data.transactions;

        }
        else if (
            Array.isArray(data.data)
        ) {

            transactionsData =
                data.data;

        }
        else {

            transactionsData = [];

        }


        transactionsData.sort(
            function (a, b) {

                const dateA =
                    new Date(
                        a.created_at ||
                        a.timestamp ||
                        a.date ||
                        0
                    );

                const dateB =
                    new Date(
                        b.created_at ||
                        b.timestamp ||
                        b.date ||
                        0
                    );

                return dateB - dateA;

            }
        );

    }
    catch (error) {

        console.error(
            "Transaction loading error:",
            error
        );

        transactionsData = [];

    }

}


/* =========================================================
   LOAD REPORTS
========================================================= */

async function loadReports() {

    try {

        const response =
            await fetch(
                "/api/reports",
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    },
                    cache: "no-store"
                }
            );

        if (!response.ok) {

            throw new Error(
                `Reports API failed: ${response.status}`
            );

        }

        const data =
            await response.json();


        if (Array.isArray(data)) {

            reportsData = data;

        }
        else if (
            Array.isArray(data.reports)
        ) {

            reportsData =
                data.reports;

        }
        else if (
            Array.isArray(data.data)
        ) {

            reportsData =
                data.data;

        }
        else {

            reportsData = [];

        }


        reportsData.sort(
            function (a, b) {

                const dateA =
                    new Date(
                        a.created_at || 0
                    );

                const dateB =
                    new Date(
                        b.created_at || 0
                    );

                return dateB - dateA;

            }
        );

    }
    catch (error) {

        console.error(
            "Reports loading error:",
            error
        );

        reportsData = [];

    }

}


/* =========================================================
   UPDATE STATISTICS
========================================================= */

function updateStatistics() {

    const total =
        transactionsData.length;

    let fraud = 0;
    let high = 0;
    let medium = 0;
    let safe = 0;

    let totalRisk = 0;


    transactionsData.forEach(
        function (transaction) {

            const score =
                getRiskScore(transaction);

            totalRisk += score;


            const level =
                getRiskLevel(
                    transaction,
                    score
                );


            if (level === "High") {

                high++;

            }
            else if (level === "Medium") {

                medium++;

            }
            else {

                safe++;

            }


            if (
                isFraudTransaction(
                    transaction
                )
            ) {

                fraud++;

            }

        }
    );


    const averageRisk =
        total > 0
            ? Math.round(
                totalRisk / total
            )
            : 0;


    const accuracy =
        calculateDetectionAccuracy();


    setText(
        "totalTransactions",
        total
    );


    setText(
        "fraudDetected",
        fraud
    );


    setText(
        "highRisk",
        high
    );


    setText(
        "detectionAccuracy",
        `${accuracy}%`
    );


    window.reportStats = {

        total: total,

        fraud: fraud,

        high: high,

        medium: medium,

        safe: safe,

        averageRisk: averageRisk

    };

}


/* =========================================================
   RISK OVERVIEW
========================================================= */

function updateRiskOverview() {

    const stats =
        window.reportStats || {

            safe: 0,

            medium: 0,

            high: 0,

            averageRisk: 0

        };


    setText(
        "safeCount",
        stats.safe
    );


    setText(
        "mediumCount",
        stats.medium
    );


    setText(
        "highCount",
        stats.high
    );


    setText(
        "riskPercentage",
        `${stats.averageRisk}%`
    );


    updateRiskCircle(
        stats.averageRisk
    );

}


/* =========================================================
   RISK CIRCLE
========================================================= */

function updateRiskCircle(score) {

    const circle =
        document.querySelector(
            ".risk-circle"
        );

    if (!circle) {
        return;
    }


    const percentage =
        Math.max(
            0,
            Math.min(
                100,
                Number(score) || 0
            )
        );


    const degrees =
        percentage * 3.6;


    circle.style.background = `
        conic-gradient(
            #06b6d4 0deg,
            #2563eb ${degrees}deg,
            #1e293b ${degrees}deg,
            #1e293b 360deg
        )
    `;

}


/* =========================================================
   AI INSIGHTS
========================================================= */

function updateAIInsights() {

    const stats =
        window.reportStats;

    if (!stats) {
        return;
    }


    const aiStatus =
        document.querySelector(
            ".ai-status"
        );

    if (!aiStatus) {
        return;
    }


    if (stats.high > 0) {

        aiStatus.innerHTML = `
            <span class="status-pulse"></span>
            ${stats.high} HIGH RISK DETECTED
        `;

        aiStatus.style.color =
            "#f87171";

    }
    else {

        aiStatus.innerHTML = `
            <span class="status-pulse"></span>
            AI ACTIVE
        `;

        aiStatus.style.color =
            "#34d399";

    }

}


/* =========================================================
   RENDER REPORTS TABLE
========================================================= */

function renderReportsTable() {

    const tbody =
        document.getElementById(
            "reportsTableBody"
        );


    if (!tbody) {
        return;
    }


    if (!reportsData.length) {

        tbody.innerHTML = `

            <tr class="empty-row">

                <td colspan="5">

                    <div class="empty-state">

                        <div class="empty-icon">

                            <i class="fas fa-file-circle-xmark"></i>

                        </div>

                        <strong>
                            No Reports Available
                        </strong>

                        <p>
                            Generate your first financial
                            security report to see it here.
                        </p>

                        <button
                            type="button"
                            onclick="generateReport()">

                            <i class="fas fa-plus"></i>

                            Generate Report

                        </button>

                    </div>

                </td>

            </tr>

        `;

        return;

    }


    const recentReports =
        reportsData.slice(0, 10);


    tbody.innerHTML =
        recentReports
            .map(
                function (report) {

                    return createReportRow(
                        report
                    );

                }
            )
            .join("");


    /*
     * IMPORTANT:
     * Buttons are dynamically created,
     * so attach events after rendering.
     */

    attachReportActions();

}


/* =========================================================
   CREATE REPORT ROW
========================================================= */

function createReportRow(report) {

    // Backend se actual report ID
    const reportId = String(
        report.id ||
        report.report_id ||
        ""
    ).trim();

    const name =
        report.name ||
        "Financial Report";

    const type =
        report.type ||
        report.report_type ||
        "Comprehensive";

    const created =
        report.created_at ||
        "Recently";

    const status =
        report.status ||
        "Completed";

    if (!reportId) {
        console.error("REPORT ID MISSING:", report);
    }

    return `
        <tr data-report-id="${escapeHTML(reportId)}">

            <td>
                <div class="report-name">

                    <div class="table-icon">
                        <i class="fas fa-file-pdf"></i>
                    </div>

                    <div>
                        <strong>
                            ${escapeHTML(name)}
                        </strong>

                        <small>
                            ${escapeHTML(reportId || "Report")}
                        </small>
                    </div>

                </div>
            </td>

            <td>
                ${escapeHTML(String(type))}
            </td>

            <td>
                ${escapeHTML(String(created))}
            </td>

            <td>
                <span class="status-badge completed">
                    <span></span>
                    ${escapeHTML(String(status))}
                </span>
            </td>

            <td>

                <div class="table-actions">

                    <!-- VIEW -->
                    <button
                        type="button"
                        class="report-view-btn"
                        data-id="${escapeHTML(reportId)}"
                        title="View Report">

                        <i class="fas fa-eye"></i>

                    </button>


                    <!-- DOWNLOAD -->
                    <button
                        type="button"
                        class="report-download-btn"
                        data-id="${escapeHTML(reportId)}"
                        title="Download Report">

                        <i class="fas fa-download"></i>

                    </button>


                    <!-- DELETE -->
                    <!-- DELETE -->
                    <button
                       type="button"
                        class="report-delete-btn"
                        data-id="${escapeHTML(reportId)}"
                        title="Delete Report"
                        onclick="deleteReport(this.dataset.id); return false;">

                        <i class="fas fa-trash"></i>

                    </button>

                </div>

            </td>

        </tr>
    `;
}


/* =========================================================
   GET RISK SCORE
========================================================= */

function getRiskScore(transaction) {

    const score =
        transaction.risk_score ??
        transaction.riskScore ??
        transaction.fraud_probability ??
        transaction.fraudProbability ??
        0;


    return Math.max(
        0,
        Math.min(
            100,
            Number(score) || 0
        )
    );

}


/* =========================================================
   GET RISK LEVEL
========================================================= */

function getRiskLevel(
    transaction,
    score
) {

    const raw =
        String(
            transaction.risk_level ??
            transaction.riskLevel ??
            ""
        ).toLowerCase();


    if (
        raw.includes("high") ||
        raw.includes("critical")
    ) {

        return "High";

    }


    if (
        raw.includes("medium") ||
        raw.includes("suspicious")
    ) {

        return "Medium";

    }


    if (
        raw.includes("low") ||
        raw.includes("safe") ||
        raw.includes("legitimate")
    ) {

        return "Safe";

    }


    if (score >= 70) {

        return "High";

    }


    if (score >= 40) {

        return "Medium";

    }


    return "Safe";

}


/* =========================================================
   FRAUD CHECK
========================================================= */

function isFraudTransaction(
    transaction
) {

    const prediction =
        String(
            transaction.prediction ??
            transaction.is_fraud ??
            transaction.isFraud ??
            ""
        ).toLowerCase();


    return (
        prediction === "fraud" ||
        prediction === "fraudulent" ||
        prediction === "true" ||
        prediction === "1" ||
        prediction === "yes"
    );

}


/* =========================================================
   DETECTION ACCURACY
========================================================= */

function calculateDetectionAccuracy() {

    if (
        window.dashboardAccuracy !==
        undefined
    ) {

        return Number(
            window.dashboardAccuracy
        ).toFixed(1);

    }


    return 0;

}


/* =========================================================
   GENERATE REPORT
========================================================= */

async function generateReport() {

    const button =
        document.querySelector(
            ".generate-main-btn"
        );


    const reportType =
        document.getElementById(
            "reportType"
        )?.value ||
        "comprehensive";


    const startDate =
        document.getElementById(
            "startDate"
        )?.value ||
        "";


    const endDate =
        document.getElementById(
            "endDate"
        )?.value ||
        "";


    const includeAI =
        document.getElementById(
            "includeAI"
        )?.checked ?? true;


    const includeCharts =
        document.getElementById(
            "includeCharts"
        )?.checked ?? true;


    if (
        startDate &&
        endDate &&
        startDate > endDate
    ) {

        showReportMessage(
            "Start date cannot be after end date.",
            "error"
        );

        return;

    }


    if (button) {

        button.disabled = true;

        button.dataset.original =
            button.innerHTML;

        button.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            Generating...
        `;

    }


    try {

        const response =
            await fetch(
                "/api/reports/generate",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            report_type:
                                reportType,

                            start_date:
                                startDate,

                            end_date:
                                endDate,

                            include_ai:
                                includeAI,

                            include_charts:
                                includeCharts

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.message ||
                "Report generation failed"
            );

        }


        showReportMessage(
            data.message ||
            "Report generated successfully.",
            "success"
        );


        await loadReports();

        renderReportsTable();

    }
    catch (error) {

        console.error(
            "Generate report error:",
            error
        );


        showReportMessage(
            error.message ||
            "Unable to generate report.",
            "error"
        );

    }
    finally {

        if (button) {

            button.disabled = false;

            button.innerHTML =
                button.dataset.original;

        }

    }

}


/* =========================================================
   VIEW REPORT
========================================================= */

async function viewReport(reportId) {

    console.log("VIEW CLICKED:", reportId);

    if (
        !reportId ||
        reportId === "-" ||
        reportId === "undefined" ||
        reportId === "null"
    ) {
        showReportMessage(
            "Report ID is not valid.",
            "error"
        );
        return;
    }

    try {

        showReportMessage(
            "Loading report...",
            "success"
        );

        const response = await fetch(
            `/api/report/${encodeURIComponent(reportId)}`,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                cache: "no-store"
            }
        );

        console.log(
            "VIEW STATUS:",
            response.status
        );

        if (!response.ok) {

            const errorData =
                await response.json()
                    .catch(() => ({}));

            throw new Error(
                errorData.detail ||
                "Report not found."
            );
        }

        const data =
            await response.json();

        console.log(
            "VIEW DATA:",
            data
        );

        if (
            !data ||
            !data.success ||
            !data.report
        ) {

            throw new Error(
                "Report details are not available."
            );
        }

        /*
         * Open actual report detail page
         */
        window.location.href =
            `/reports/${encodeURIComponent(reportId)}`;

    }
    catch (error) {

        console.error(
            "VIEW REPORT ERROR:",
            error
        );

        showReportMessage(
            error.message ||
            "Unable to open report.",
            "error"
        );

    }

}

/* =========================================================
   REPORT DETAILS MODAL
========================================================= */

function showReportDetails(report) {

    const old =
        document.querySelector(
            ".report-modal"
        );


    if (old) {

        old.remove();

    }


    const modal =
        document.createElement(
            "div"
        );


    modal.className =
        "report-modal";


    modal.innerHTML = `

        <div
            class="report-modal-backdrop"
            onclick="closeReportModal()">
        </div>


        <div class="report-modal-content">


            <button
                type="button"
                class="report-modal-close"
                onclick="closeReportModal()">

                <i class="fas fa-times"></i>

            </button>


            <div class="report-modal-icon">

                <i class="fas fa-file-shield"></i>

            </div>


            <h2>

                ${escapeHTML(
                    report.title ||
                    report.name ||
                    "Financial Report"
                )}

            </h2>


            <p class="report-modal-id">

                ${escapeHTML(
                    report.id || "-"
                )}

            </p>


            <div class="report-detail-grid">


                <div>

                    <span>
                        Total Transactions
                    </span>

                    <strong>
                        ${report.total_transactions || 0}
                    </strong>

                </div>


                <div>

                    <span>
                        Fraud Detected
                    </span>

                    <strong>
                        ${report.fraud_detected || 0}
                    </strong>

                </div>


                <div>

                    <span>
                        High Risk
                    </span>

                    <strong>
                        ${report.high_risk || 0}
                    </strong>

                </div>


                <div>

                    <span>
                        Medium Risk
                    </span>

                    <strong>
                        ${report.medium_risk || 0}
                    </strong>

                </div>


                <div>

                    <span>
                        Safe Transactions
                    </span>

                    <strong>
                        ${report.safe_transactions || 0}
                    </strong>

                </div>


                <div>

                    <span>
                        Average Risk
                    </span>

                    <strong>
                        ${report.average_risk || 0}%
                    </strong>

                </div>


            </div>


            <div class="report-modal-summary">

                <span>
                    AI Summary
                </span>


                <p>

                    ${escapeHTML(
                        report.ai_summary ||
                        "No AI summary available."
                    )}

                </p>

            </div>


        </div>

    `;


    document.body.appendChild(
        modal
    );

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeReportModal() {

    const modal =
        document.querySelector(
            ".report-modal"
        );


    if (modal) {

        modal.remove();

    }

}


/* =========================================================
   DOWNLOAD REPORT
========================================================= */

/* =========================================================
   DOWNLOAD REPORT
   WORKING VERSION
========================================================= */

async function downloadReport(reportId) {

    console.log("DOWNLOAD CLICKED:", reportId);

    if (!reportId || reportId === "-" || reportId === "undefined") {
        showReportMessage("Report ID is not valid.", "error");
        return;
    }

    try {

        showReportMessage(
            "Generating PDF...",
            "success"
        );

        const response = await fetch(
            `/api/report/${encodeURIComponent(reportId)}/download`,
            {
                method: "GET",
                cache: "no-store"
            }
        );

        console.log("DOWNLOAD STATUS:", response.status);
        console.log(
            "DOWNLOAD CONTENT TYPE:",
            response.headers.get("content-type")
        );

        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "DOWNLOAD SERVER ERROR:",
                errorText
            );

            throw new Error(
                `Download failed (${response.status})`
            );
        }

        const blob =
            await response.blob();

        console.log(
            "PDF SIZE:",
            blob.size
        );

        if (!blob || blob.size < 100) {

            throw new Error(
                "Server returned an empty PDF."
            );
        }

        const url =
            window.URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            `${reportId}_FinGuard_Report.pdf`;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        setTimeout(() => {
            window.URL.revokeObjectURL(url);
        }, 1000);

        showReportMessage(
            "Report downloaded successfully.",
            "success"
        );

    }
    catch (error) {

        console.error(
            "DOWNLOAD ERROR:",
            error
        );

        showReportMessage(
            error.message ||
            "Unable to download report.",
            "error"
        );
    }
}



/* =========================================================
   DELETE REPORT
========================================================= */

async function deleteReport(reportId) {

    console.log(
        "DELETE CLICK:",
        reportId
    );


    if (
        !reportId ||
        reportId === "-"
    ) {

        showReportMessage(
            "Report ID missing.",
            "error"
        );

        return;

    }


    const confirmed =
        window.confirm(
            `Are you sure you want to delete report ${reportId}?`
        );


    if (!confirmed) {

        return;

    }


    try {

        showReportMessage(
            "Deleting report...",
            "success"
        );


        const response =
            await fetch(
                `/api/report/${encodeURIComponent(reportId)}`,
                {
                    method: "DELETE",

                    headers: {
                        "Accept":
                            "application/json"
                    },

                    cache: "no-store"
                }
            );


        const data =
            await response.json()
                .catch(
                    function () {
                        return {};
                    }
                );


        console.log(
            "DELETE RESPONSE:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.detail ||
                data.error ||
                data.message ||
                "Unable to delete report."
            );

        }


        if (
            data.success === false
        ) {

            throw new Error(
                data.message ||
                "Unable to delete report."
            );

        }


        showReportMessage(
            "Report deleted successfully.",
            "success"
        );


        /*
         * Reload reports from database.
         */

        await loadReports();


        /*
         * Update table.
         */

        renderReportsTable();


    }
    catch (error) {

        console.error(
            "DELETE REPORT ERROR:",
            error
        );


        showReportMessage(
            error.message ||
            "Unable to delete report.",
            "error"
        );

    }

}


/* =========================================================
   ATTACH REPORT ACTIONS
========================================================= */

function attachReportActions() {


    /* =====================================================
       VIEW BUTTON
    ===================================================== */

    document
        .querySelectorAll(
            ".report-view-btn"
        )
        .forEach(
            function (button) {

                button.onclick =
                    function () {

                        const id =
                            this.dataset.id;

                        console.log(
                            "VIEW CLICK:",
                            id
                        );

                        viewReport(id);

                    };

            }
        );


    /* =====================================================
       DOWNLOAD BUTTON
    ===================================================== */

    document
        .querySelectorAll(
            ".report-download-btn"
        )
        .forEach(
            function (button) {

                button.onclick =
                    function () {

                        const id =
                            this.dataset.id;

                        console.log(
                            "DOWNLOAD CLICK:",
                            id
                        );

                        downloadReport(id);

                    };

            }
        );


    /* =====================================================
       DELETE BUTTON
    ===================================================== */

    document
        .querySelectorAll(
            ".report-delete-btn"
        )
        .forEach(
            function (button) {

                button.onclick =
                    function (event) {

                        event.preventDefault();

                        event.stopPropagation();


                        const id =
                            this.dataset.id;


                        console.log(
                            "DELETE BUTTON CLICK:",
                            id
                        );


                        deleteReport(id);

                    };

            }
        );

}


/* =========================================================
   REFRESH REPORTS
========================================================= */

async function refreshReports() {

    showReportMessage(
        "Refreshing report data...",
        "success"
    );


    await loadReportsDashboard();

    await loadModelAccuracy();

}


/* =========================================================
   VIEW ALL
========================================================= */

function viewAllReports() {

    const section =
        document.getElementById(
            "reportsSection"
        );


    if (section) {

        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

}
/* =====================================================
   DELETE BUTTON
===================================================== */

document
    .querySelectorAll(".delete-action")
    .forEach(
        function (button) {

            button.onclick =
                function () {

                    const reportId =
                        this.dataset.reportId;

                    console.log(
                        "DELETE BUTTON CLICK:",
                        reportId
                    );

                    deleteReport(reportId);

                };

        }
    );


/* =========================================================
   ADD TRANSACTION
========================================================= */

function goToAddTransaction() {

    window.location.href =
        "/add-transaction";

}


/* =========================================================
   FORMAT AMOUNT
========================================================= */

function formatAmount(amount) {

    return (
        Number(amount) || 0
    ).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replace(
            /[&<>"']/g,
            function (character) {

                return {

                    "&":
                        "&amp;",

                    "<":
                        "&lt;",

                    ">":
                        "&gt;",

                    '"':
                        "&quot;",

                    "'":
                        "&#039;"

                }[character];

            }
        );

}


/* =========================================================
   ESCAPE ATTRIBUTE
========================================================= */

function escapeAttribute(value) {

    return String(value)
        .replace(
            /['"\\]/g,
            function (character) {

                return "\\" +
                    character;

            }
        );

}


/* =========================================================
   SET TEXT
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   LOADING
========================================================= */

function showLoadingState() {

    document
        .querySelector(
            ".reports-page"
        )
        ?.classList.add(
            "reports-loading"
        );

}


function hideLoadingState() {

    document
        .querySelector(
            ".reports-page"
        )
        ?.classList.remove(
            "reports-loading"
        );

}


/* =========================================================
   TOAST MESSAGE
========================================================= */

function showReportMessage(
    message,
    type = "success"
) {

    const oldToast =
        document.querySelector(
            ".report-toast"
        );


    if (oldToast) {

        oldToast.remove();

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `report-toast ${type}`;


    toast.innerHTML = `

        <i class="fas ${
            type === "success"
                ? "fa-circle-check"
                : "fa-circle-exclamation"
        }"></i>

        <span>
            ${escapeHTML(message)}
        </span>

    `;


    document.body.appendChild(
        toast
    );


    requestAnimationFrame(
        function () {

            toast.classList.add(
                "show"
            );

        }
    );


    setTimeout(
        function () {

            toast.classList.remove(
                "show"
            );


            setTimeout(
                function () {

                    if (toast) {

                        toast.remove();

                    }

                },
                300
            );

        },
        3500
    );

}


/* =========================================================
   MODEL ACCURACY
========================================================= */

async function loadModelAccuracy() {

    const accuracyElement =
        document.getElementById(
            "detectionAccuracy"
        );


    if (!accuracyElement) {

        return;

    }


    try {

        accuracyElement.textContent =
            "Loading...";


        const response =
            await fetch(
                "/api/model-performance",
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    },
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Model performance API failed: ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "MODEL PERFORMANCE:",
            data
        );


        let accuracy =
            data.accuracy ??
            data.accuracy_percent ??
            data.model_accuracy ??
            data.metrics?.accuracy ??
            data.performance?.accuracy ??
            0;


        accuracy =
            Number(accuracy);


        /*
         * Support:
         *
         * 0.998
         *
         * OR
         *
         * 99.8
         */

        if (
            accuracy > 0 &&
            accuracy <= 1
        ) {

            accuracy =
                accuracy * 100;

        }


        if (
            !Number.isFinite(
                accuracy
            )
        ) {

            accuracy = 0;

        }


        accuracy =
            Math.max(
                0,
                Math.min(
                    100,
                    accuracy
                )
            );


        window.dashboardAccuracy =
            accuracy;


        accuracyElement.textContent =
            `${accuracy.toFixed(1)}%`;


        /*
         * Update statistics again
         */

        updateStatistics();

    }
    catch (error) {

        console.error(
            "Model performance error:",
            error
        );


        accuracyElement.textContent =
            "N/A";

    }

}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.generateReport =
    generateReport;


window.viewReport =
    viewReport;


window.downloadReport =
    downloadReport;


window.deleteReport =
    deleteReport;


window.viewAllReports =
    viewAllReports;


window.refreshReports =
    refreshReports;


window.closeReportModal =
    closeReportModal;


window.goToAddTransaction =
    goToAddTransaction;


window.showReportMessage =
    showReportMessage;


window.loadReports =
    loadReports;


window.loadReportsDashboard =
    loadReportsDashboard;
document.addEventListener("click", function (event) {

    const button = event.target.closest(".report-delete-btn");

    if (!button) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    const row = button.closest("tr");

    const id =
        button.dataset.id ||
        row?.dataset.reportId;

    console.log("DELETE BUTTON CLICK:", id);

    if (!id) {
        alert("Report ID not found");
        return;
    }

    deleteReport(id);
});