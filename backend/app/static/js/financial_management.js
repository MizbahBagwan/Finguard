/* =========================================================
   FINANCIAL MANAGEMENT - API
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    loadFinancialSummary();
    loadFinancialCategories();
    loadRecentTransactions();

});


/* =========================================================
   FINANCIAL SUMMARY
   GET /financial/summary
========================================================= */

async function loadFinancialSummary() {

    try {

        const response = await fetch(
            "/financial/summary",
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                `Summary API error: ${response.status}`
            );
        }

        const data = await response.json();

        console.log("Financial Summary:", data);

        const income = Number(data.total_income) || 0;
        const expenses = Number(data.total_expenses) || 0;
        const balance = Number(data.balance) || 0;


        /* Summary cards */

        setText(
            "totalIncome",
            formatMoney(income)
        );

        setText(
            "totalExpenses",
            formatMoney(expenses)
        );

        setText(
            "availableBalance",
            formatMoney(balance)
        );


        /* Financial health */

        calculateFinancialHealth(
            income,
            expenses,
            balance
        );


    } catch (error) {

        console.error(
            "Financial summary failed:",
            error
        );

    }

}


/* =========================================================
   FINANCIAL HEALTH
========================================================= */

function calculateFinancialHealth(
    income,
    expenses,
    balance
) {

    let health = 0;


    if (income > 0) {

        health =
            (balance / income) * 100;

    }


    /*
       Keep value between 0 and 100
    */

    health =
        Math.max(
            0,
            Math.min(
                100,
                health
            )
        );


    health =
        Math.round(health);


    console.log(
        "Financial Health:",
        health
    );


    /* Main health percentage */

    setText(
        "financialHealth",
        `${health}%`
    );


    setText(
        "healthPercentage",
        `${health}%`
    );


    /* Health text */

    const healthText =
        document.getElementById(
            "healthDescription"
        );


    if (healthText) {

        if (health >= 80) {

            healthText.textContent =
                "Excellent financial position";

        } else if (health >= 60) {

            healthText.textContent =
                "Healthy financial position";

        } else if (health >= 40) {

            healthText.textContent =
                "Moderate financial position";

        } else {

            healthText.textContent =
                "Needs financial attention";

        }

    }


    /* Circle */

    const healthCircle =
        document.querySelector(
            ".health-progress"
        );


    if (healthCircle) {

        healthCircle.style.setProperty(
            "--health",
            `${health}%`
        );

    }


    /* Extra financial health values */

    setText(
        "healthIncome",
        formatMoney(income)
    );

    setText(
        "healthExpenses",
        formatMoney(expenses)
    );

    setText(
        "healthSavings",
        formatMoney(balance)
    );


    let savingsRate = 0;

    if (income > 0) {

        savingsRate =
            (balance / income) * 100;

    }

    savingsRate =
        Math.max(
            0,
            Math.min(
                100,
                Math.round(savingsRate)
            )
        );


    setText(
        "savingsRate",
        `${savingsRate}%`
    );

}


/* =========================================================
   CATEGORIES
   GET /financial/categories
========================================================= */

async function loadFinancialCategories() {

    const container =
        document.getElementById(
            "categoryList"
        );

    const loading =
        document.getElementById(
            "categoriesLoading"
        );

    const error =
        document.getElementById(
            "categoriesError"
        );


    try {

        console.log(
            "Loading financial categories..."
        );


        const response =
            await fetch(
                "/financial/categories",
                {
                    method: "GET",

                    headers: {
                        "Accept": "application/json"
                    },

                    cache: "no-store"
                }
            );


        console.log(
            "Categories API:",
            response.status
        );


        if (!response.ok) {

            throw new Error(
                `Categories API error: ${response.status}`
            );

        }


        const categories =
            await response.json();


        console.log(
            "Categories:",
            categories
        );


        /* Hide loading */

        if (loading) {

            loading.style.display =
                "none";

        }


        /* Clear old data */

        if (container) {

            container.innerHTML = "";

        }


        /* Empty */

        if (
            !Array.isArray(categories) ||
            categories.length === 0
        ) {

            if (container) {

                container.innerHTML = `
                    <div class="empty-category">
                        <i class="fa-solid fa-chart-pie"></i>
                        <p>No expense categories found.</p>
                    </div>
                `;

            }

            return;

        }


        /* Render categories */

        categories.forEach(
            function (item) {

                if (!container) {
                    return;
                }


                const category =
                    item.category ||
                    "Other";


                const amount =
                    Number(item.amount) || 0;


                const element =
                    document.createElement(
                        "div"
                    );


                element.className =
                    "category-item";


                element.innerHTML = `

                    <div class="category-left">

                        <div class="category-icon">
                            <i class="fa-solid fa-wallet"></i>
                        </div>

                        <div class="category-info">

                            <strong>
                                ${escapeHtml(category)}
                            </strong>

                            <span>
                                Expense category
                            </span>

                        </div>

                    </div>


                    <div class="category-amount">
                        ₹${formatAmount(amount)}
                    </div>

                `;


                container.appendChild(
                    element
                );

            }
        );


    } catch (errorObject) {

        console.error(
            "Categories loading failed:",
            errorObject
        );


        if (loading) {

            loading.style.display =
                "none";

        }


        if (error) {

            error.style.display =
                "flex";

            error.textContent =
                "Unable to load categories.";

        }


        /*
           IMPORTANT:
           Loading must NEVER remain visible
           after an error.
        */

        if (container) {

            container.innerHTML = `
                <div class="empty-category error-category">
                    <i class="fa-solid fa-circle-exclamation"></i>

                    <p>
                        Unable to load expense categories.
                    </p>
                </div>
            `;

        }

    }

}


/* =========================================================
   RECENT TRANSACTIONS
   GET /financial/recent-transactions
========================================================= */

async function loadRecentTransactions() {

    const container =
        document.getElementById(
            "recentTransactionsList"
        );

    const loading =
        document.getElementById(
            "transactionsLoading"
        );

    const empty =
        document.getElementById(
            "transactionsEmpty"
        );


    if (!container) {

        console.warn(
            "recentTransactionsList not found."
        );

        return;

    }


    try {

        const response =
            await fetch(
                "/financial/recent-transactions",
                {
                    method: "GET",

                    headers: {
                        "Accept": "application/json"
                    },

                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Transactions API error: ${response.status}`
            );

        }


        const transactions =
            await response.json();


        console.log(
            "Recent Transactions:",
            transactions
        );


        if (loading) {

            loading.style.display =
                "none";

        }


        container.innerHTML = "";


        if (
            !Array.isArray(transactions) ||
            transactions.length === 0
        ) {

            if (empty) {

                empty.style.display =
                    "flex";

            }

            return;

        }


        if (empty) {

            empty.style.display =
                "none";

        }


        transactions.forEach(
            function (transaction) {

                const type =
                    String(
                        transaction.transaction_type || ""
                    ).toLowerCase();


                const isIncome =
                    type === "income";


                const sign =
                    isIncome
                        ? "+"
                        : "-";


                const icon =
                    isIncome
                        ? "fa-arrow-down"
                        : "fa-arrow-up";


                const cssClass =
                    isIncome
                        ? "income"
                        : "expense";


                const category =
                    transaction.category ||
                    "Other";


                const description =
                    transaction.description ||
                    "No description";


                const amount =
                    Number(
                        transaction.amount
                    ) || 0;


                const transactionId =
                    transaction.transaction_id ||
                    "N/A";


                const date =
                    formatTransactionDate(
                        transaction.date
                    );


                const element =
                    document.createElement(
                        "div"
                    );


                element.className =
                    "transaction-item";


                element.innerHTML = `

                    <div class="transaction-icon ${cssClass}">
                        <i class="fa-solid ${icon}"></i>
                    </div>


                    <div class="transaction-main">

                        <p class="transaction-category">
                            ${escapeHtml(category)}
                        </p>

                        <p class="transaction-description">
                            ${escapeHtml(description)}
                        </p>

                    </div>


                    <div class="transaction-meta">

                        <p class="transaction-id">
                            ${escapeHtml(transactionId)}
                        </p>

                        <p class="transaction-date">
                            ${escapeHtml(date)}
                        </p>

                    </div>


                    <div class="transaction-amount ${cssClass}">
                        ${sign}₹${formatAmount(amount)}
                    </div>

                `;


                container.appendChild(
                    element
                );

            }
        );


    } catch (errorObject) {

        console.error(
            "Recent transactions failed:",
            errorObject
        );


        if (loading) {

            loading.style.display =
                "none";

        }


        container.innerHTML = `

            <div class="empty-category error-category">

                <i class="fa-solid fa-circle-exclamation"></i>

                <p>
                    Unable to load recent transactions.
                </p>

            </div>

        `;

    }

}


/* =========================================================
   HELPERS
========================================================= */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            value;

    }

}


function formatAmount(amount) {

    return Number(
        amount
    ).toLocaleString(
        "en-IN",
        {
            maximumFractionDigits: 2
        }
    );

}


function formatMoney(amount) {

    return `₹${formatAmount(amount)}`;

}


function formatTransactionDate(
    dateValue
) {

    if (!dateValue) {

        return "Date unavailable";

    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Date unavailable";

    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function escapeHtml(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}