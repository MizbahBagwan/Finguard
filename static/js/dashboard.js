// Check Login
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "/login";
}

// Chart
const ctx = document.getElementById("expenseChart");

new Chart(ctx, {
    type: "doughnut",
    data: {
        labels: [
            "Food",
            "Shopping",
            "Travel",
            "Bills",
            "Others"
        ],
        datasets: [{
            data: [25, 20, 18, 22, 15],
            backgroundColor: [
                "#4F8CFF",
                "#7C5CFF",
                "#00E676",
                "#FFC107",
                "#FF5252"
            ],
            borderWidth: 0
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                labels: {
                    color: "white"
                }
            }
        }
    }
});

// Load Dashboard Data
async function loadDashboard() {

    try {

        const response = await fetch("/api/dashboard", {

            headers: {
                Authorization: `Bearer ${token}`
            }

        });

        if (!response.ok) return;

        const data = await response.json();

        console.log(data);

        // Later:
        // document.getElementById(...)
        // update cards dynamically

    } catch (err) {

        console.log(err);

    }

}

loadDashboard();