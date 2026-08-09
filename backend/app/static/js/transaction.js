// ======================================================
// FinGuard AI Transactions JS
// ======================================================


document.addEventListener("DOMContentLoaded",()=>{


    initializeSearch();

    initializeRiskFilter();

    initializeDateFilter();

    initializeButtons();

    initializeSorting();

    initializeCounters();

    initializeCharts();

    initializeAIButton();

    initializeLoader();


});





// ======================================================
// SEARCH
// ======================================================


function initializeSearch(){


const input =
document.getElementById("searchInput");


if(!input) return;



input.addEventListener("keyup",()=>{


const value =
input.value.toLowerCase();



document
.querySelectorAll(".transaction-row")
.forEach(row=>{


row.style.display =
row.innerText
.toLowerCase()
.includes(value)
?
""
:
"none";


});


});


}





// ======================================================
// RISK FILTER
// ======================================================


// ======================================================
// RISK FILTER
// ======================================================

function initializeRiskFilter() {

    const apply = document.getElementById("applyFilter");

    if (!apply) {
        console.error("Apply Filter button not found");
        return;
    }

    apply.addEventListener("click", function () {

        const riskElement = document.getElementById("riskFilter");
        const dateElement = document.getElementById("dateFilter");

        const selectedRisk = riskElement ? riskElement.value.trim().toLowerCase() : "";
        const selectedDate = dateElement ? dateElement.value : "";

        const rows = document.querySelectorAll(".transaction-row");

        rows.forEach(function (row) {

            const rowRisk = (row.dataset.risk || "").trim().toLowerCase();
            const rowDate = row.dataset.date || "";

            let show = true;

            // Risk Filter
            if (selectedRisk !== "" && rowRisk !== selectedRisk) {
                show = false;
            }

            // Date Filter
            if (selectedDate !== "" && rowDate !== selectedDate) {
                show = false;
            }

            row.style.display = show ? "" : "none";

        });

        showToast("Filter Applied Successfully");

    });

}


// ======================================================
// RESET FILTER
// ======================================================


function initializeButtons(){



const reset =
document.getElementById("resetFilter");



if(reset){


reset.addEventListener("click",()=>{


const risk =
document.getElementById("riskFilter");


const date =
document.getElementById("dateFilter");


const search =
document.getElementById("searchInput");



if(risk)
risk.value="";



if(date)
date.value="";



if(search)
search.value="";





document
.querySelectorAll(".transaction-row")
.forEach(row=>{


row.style.display="";


});



showToast(
"Filters reset successfully"
);



});



}






// Refresh

const refresh =
document.getElementById("refreshPage");


if(refresh){


refresh.onclick=()=>{


location.reload();


};


}






// Export


const exportBtn =
document.getElementById("exportPdf");


if(exportBtn){


exportBtn.onclick=()=>{


window.print();


showToast(
"Report exported"
);


};


}



}









// ======================================================
// DATE FILTER
// ======================================================


function initializeDateFilter(){


const date =
document.getElementById("dateFilter");


if(!date) return;



date.addEventListener("change",()=>{


console.log(
"Selected Date:",
date.value
);


});


}










// ======================================================
// SORTING
// ======================================================


function initializeSorting(){



document
.querySelectorAll(".transaction-table th")
.forEach((header,index)=>{



header.style.cursor="pointer";



header.addEventListener("click",()=>{


sortTable(index);


});


});



}




function sortTable(column){



const table =
document.querySelector(
".transaction-table tbody"
);



if(!table) return;



let rows =
Array.from(
table.querySelectorAll("tr")
);



rows.sort((a,b)=>{


let A =
a.children[column]
.innerText;


let B =
b.children[column]
.innerText;



return A.localeCompare(
B,
undefined,
{
numeric:true
}
);



});



rows.forEach(row=>{


table.appendChild(row);


});



}










// ======================================================
// COUNTER ANIMATION
// ======================================================


function initializeCounters(){


document
.querySelectorAll(".counter")
.forEach(counter=>{


let target =
Number(counter.dataset.target || 0);



let current=0;


let speed =
Math.max(
1,
target/80
);



function update(){


current += speed;



if(current < target){


counter.innerText =
Math.floor(current);


requestAnimationFrame(update);


}
else{


counter.innerText =
target;


}


}



update();



});


}









// ======================================================
// CHARTS
// ======================================================


function initializeCharts() {

    if (typeof Chart === "undefined") {
        console.error("Chart.js not loaded!");
        return;
    }

    fetch("/api/transaction-chart-data")
        .then(response => {
            if (!response.ok) {
                throw new Error("API Error: " + response.status);
            }
            return response.json();
        })
        .then(data => {

            console.log("CHART DATA:", data);

            // =========================================
            // RISK DISTRIBUTION
            // =========================================

            const riskCanvas =
                document.getElementById("riskChart");

            if (riskCanvas) {

                const safe =
                    Number(data.risk_distribution?.safe || 0);

                const medium =
                    Number(data.risk_distribution?.medium || 0);

                const high =
                    Number(data.risk_distribution?.high || 0);

                console.log(
                    "Risk:",
                    safe,
                    medium,
                    high
                );

                // Destroy previous chart
                const oldRiskChart =
                    Chart.getChart(riskCanvas);

                if (oldRiskChart) {
                    oldRiskChart.destroy();
                }

                new Chart(riskCanvas, {

                    type: "doughnut",

                    data: {

                        labels: [
                            "Safe",
                            "Medium",
                            "High"
                        ],

                        datasets: [{

                            data: [
                                safe,
                                medium,
                                high
                            ],

                            backgroundColor: [
                                "#22c55e",
                                "#f59e0b",
                                "#ef4444"
                            ],

                            borderColor: "#0f172a",

                            borderWidth: 4,

                            hoverOffset: 10

                        }]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false,

                        cutout: "65%",

                        plugins: {

                            legend: {

                                display: true,

                                position: "bottom",

                                labels: {

                                    color: "#cbd5e1",

                                    usePointStyle: true,

                                    padding: 18,

                                    generateLabels: function(chart) {

                                        const values = [
                                            safe,
                                            medium,
                                            high
                                        ];

                                        const colors = [
                                            "#0b546f",
                                            "#0b49f5",
                                            "#36edbc"
                                        ];

                                        return chart.data.labels.map(
                                            (label, index) => {

                                                return {

                                                    text:
                                                        `${label} (${values[index]})`,

                                                    fillStyle:
                                                        colors[index],

                                                    strokeStyle:
                                                        colors[index],

                                                    lineWidth: 0,

                                                    hidden: false,

                                                    index: index,

                                                    pointStyle:
                                                        "circle"

                                                };

                                            }
                                        );

                                    }

                                }

                            },

                            tooltip: {

                                callbacks: {

                                    label: function(context) {

                                        const values = [
                                            safe,
                                            medium,
                                            high
                                        ];

                                        return `${context.label}: ${values[context.dataIndex]}`;

                                    }

                                }

                            }

                        },

                        animation: {

                            duration: 1000

                        }

                    }

                });

            } else {

                console.error(
                    "riskChart canvas not found!"
                );

            }


            // =========================================
            // FRAUD PROBABILITY
            // =========================================

            const fraudCanvas =
                document.getElementById("fraudChart");

            if (fraudCanvas) {

                const fraudData =
                    data.fraud_probability || [];

                const labels =
                    fraudData.map(item => item.id);

                const scores =
                    fraudData.map(
                        item => Number(item.score || 0)
                    );


                // Destroy old chart
                const oldFraudChart =
                    Chart.getChart(fraudCanvas);

                if (oldFraudChart) {
                    oldFraudChart.destroy();
                }


                new Chart(fraudCanvas, {

                    type: "bar",

                    data: {

                        labels: labels,

                        datasets: [{

                            label:
                                "Fraud Probability %",

                            data: scores,

                            backgroundColor:
                                "rgba(13, 225, 244, 0.49)",
                            borderRadius: 8

                        }]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false,

                        scales: {

                            y: {

                                beginAtZero: true,

                                max: 100,

                                ticks: {

                                    color: "#cbd5e1"

                                },

                                grid: {

                                    color:
                                        "rgba(255,255,255,0.08)"

                                }

                            },

                            x: {

                                ticks: {

                                    color: "#cbd5e1"

                                },

                                grid: {

                                    display: false

                                }

                            }

                        },

                        plugins: {

                            legend: {

                                labels: {

                                    color: "#cbd5e1"

                                }

                            }

                        }

                    }

                });

            } else {

                console.error(
                    "fraudChart canvas not found!"
                );

            }


            // =========================================
            // WEEKLY TRANSACTION TREND
            // =========================================

            const transactionCanvas =
                document.getElementById(
                    "transactionChart"
                );

            if (transactionCanvas) {

                const totalTransactions =
                    (data.risk_distribution?.safe || 0) +
                    (data.risk_distribution?.medium || 0) +
                    (data.risk_distribution?.high || 0);


                const oldTransactionChart =
                    Chart.getChart(transactionCanvas);

                if (oldTransactionChart) {
                    oldTransactionChart.destroy();
                }


                new Chart(transactionCanvas, {

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

                        datasets: [{

                            label:
                                "Transactions",

                            data: [
                                0,
                                0,
                                0,
                                0,
                                0,
                                0,
                                totalTransactions
                            ],

                            tension: 0.4,

                            fill: true,

                            borderColor:
                                "#38bdf8",

                            backgroundColor:
                                "rgba(56,189,248,0.12)",

                            borderWidth: 3

                        }]

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

                                ticks: {
                                    color: "#cbd5e1"
                                }

                            },

                            x: {

                                ticks: {
                                    color: "#cbd5e1"
                                }

                            }

                        }

                    }

                });

            }

        })

        .catch(error => {

            console.error(
                "Chart API Error:",
                error
            );

        });

}
// ======================================================
// AI BUTTON
// ======================================================


function initializeAIButton(){



const ai =
document.querySelector(".ai-fab");



if(ai){


ai.onclick=()=>{


window.location.href="/copilot";


};



}



}









// ======================================================
// LOADER
// ======================================================


function initializeLoader(){



const loader =
document.getElementById(
"loadingOverlay"
);



if(loader){


setTimeout(()=>{


loader.style.display="none";


},800);



}



}









// ======================================================
// TOAST
// ======================================================


function showToast(message){



const toast =
document.createElement("div");



toast.className="toast";



toast.innerHTML=`

<i class="fa-solid fa-circle-check"></i>

${message}

`;



document.body.appendChild(toast);



setTimeout(()=>{


toast.classList.add("show");


},100);





setTimeout(()=>{


toast.classList.remove("show");



setTimeout(()=>{


toast.remove();


},300);



},3000);



}
// ==================================
// FRAUD PROBABILITY CHART
// ==================================

const fraud =
document.getElementById("fraudChart");


if(fraud){


    fetch("/api/transaction-chart-data")
    .then(response => response.json())
    .then(data => {


        console.log(
            "FRAUD CHART DATA:",
            data.fraud_probability
        );


        new Chart(fraud, {


            type:"bar",


            data:{


                labels:

                data.fraud_probability.map(
                    item => item.id
                ),


                datasets:[{


                    label:
                    "Fraud Probability %",


                    data:

                    data.fraud_probability.map(
                        item => item.score
                    )


                }]


            },


            options:{


                responsive:true,


                scales:{


                    y:{


                        beginAtZero:true,

                        max:100


                    }


                }


            }


        });



    });


}
// ==================================
// RISK OVERVIEW COLOR CHART
// ==================================

const overview =
document.getElementById("riskOverviewChart");


if(overview && typeof Chart !== "undefined"){


    new Chart(overview, {


        type:"polarArea",


        data:{


            labels:[

                "Safe Transactions",
                "Medium Risk",
                "High Risk"

            ],


            datasets:[{

                label:"Risk Overview",

                data:[

                    3,
                    0,
                    2

                ]

            }]


        },


        options:{


            responsive:true,


            plugins:{


                legend:{


                    position:"bottom"


                }


            }


        }


    });


}
