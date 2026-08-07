/* ==========================================
   FinGuard AI Dashboard
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    initClock();

    startAIStatus();

});

/* ==========================================
   LIVE CLOCK
========================================== */

function initClock(){

    const el=document.getElementById("currentTime");

    if(!el) return;

    function update(){

        const now=new Date();

        el.innerHTML=now.toLocaleTimeString([],{

            hour:"2-digit",

            minute:"2-digit",

            second:"2-digit"

        });

    }

    update();

    setInterval(update,1000);

}

/* ==========================================
   ANIMATED COUNTERS
========================================== */

function counter(id,target){

    const el=document.getElementById(id);

    if(!el) return;

    let value=0;

    const speed=Math.max(1,Math.floor(target/80));

    const timer=setInterval(()=>{

        value+=speed;

        if(value>=target){

            value=target;

            clearInterval(timer);

        }

        el.innerHTML=value.toLocaleString();

    },20);

}

/*function animateCounters(){

    counter("totalTransactions",15482);

    counter("highRisk",126);

    counter("mediumRisk",412);

    counter("safeTransactions",14944);

}*/

/* ==========================================
   AI STATUS
========================================== */

function startAIStatus(){

    const messages=[

        "Monitoring live transactions...",

        "Scanning merchant behaviour...",

        "AI model updated successfully.",

        "No critical fraud detected.",

        "Risk engine running normally."

    ];

    const box=document.getElementById("aiInsights");

    if(!box) return;

    setInterval(()=>{

        const msg=messages[
            Math.floor(Math.random()*messages.length)
        ];

        const item=document.createElement("div");

        item.className="insight info";

        item.innerHTML=`
        <i class="fa-solid fa-robot"></i>
        ${msg}
        `;

        box.prepend(item);

        if(box.children.length>4){

            box.removeChild(box.lastChild);

        }

    },7000);

}
/* ==========================================
   CHARTS
========================================== */


  
async function initCharts(){

    await initRiskChart();

    await initTrendChart();

}

/* ==========================================
   RISK DISTRIBUTION
========================================== */

async function initRiskChart(){

    const canvas=document.getElementById("riskDistributionChart");

    if(!canvas) return;


    const response = await fetch("/dashboard/risk");

    const data = await response.json();


    let labels=[];
    let values=[];


    data.forEach(item=>{

        labels.push(item.risk_level);

        values.push(item.count);

    });


    new Chart(canvas,{

        type:"doughnut",

        data:{

            labels:labels,

            datasets:[{

                data:values,

                backgroundColor:[

                    "#22C55E",

                    "#F59E0B",

                    "#EF4444"

                ],

                borderWidth:0,

                hoverOffset:15

            }]

        },


        options:{

            responsive:true,

            cutout:"72%",


            plugins:{

                legend:{

                    position:"bottom",

                    labels:{

                        color:"#94A3B8",

                        padding:20,

                        usePointStyle:true

                    }

                }

            }

        }

    });


}

/* ==========================================
   FRAUD TREND
========================================== */

async function initTrendChart(){

    const canvas = document.getElementById("fraudTrendChart");

    if(!canvas) return;


    const response = await fetch("/dashboard/trend");

    const trendData = await response.json();


    const labels = trendData.map(
        item => item.date
    );


    const values = trendData.map(
        item => item.transactions
    );


    new Chart(canvas,{

        type:"line",

        data:{

            labels: labels,

            datasets:[{

                label:"Transactions",

                data: values,

                borderColor:"#4F8CFF",

                backgroundColor:"rgba(79,140,255,.18)",

                fill:true,

                tension:.45

            }]

        }

    });

}
/* ==========================================
   RECENT TRANSACTIONS
========================================== */

/*function loadRecentTransactions(){

    const tbody=document.getElementById("recentTransactionsBody");

    if(!tbody) return;

    const data=[

        {
            id:"TXN-1001",
            merchant:"Amazon",
            amount:"₹8,450",
            risk:"High",
            score:"96%",
            status:"Pending"
        },

        {
            id:"TXN-1002",
            merchant:"Flipkart",
            amount:"₹2,100",
            risk:"Safe",
            score:"08%",
            status:"Approved"
        },

        {
            id:"TXN-1003",
            merchant:"Steam",
            amount:"₹5,900",
            risk:"Medium",
            score:"58%",
            status:"Review"
        },

        {
            id:"TXN-1004",
            merchant:"Netflix",
            amount:"₹649",
            risk:"Safe",
            score:"03%",
            status:"Approved"
        },

        {
            id:"TXN-1005",
            merchant:"Unknown Merchant",
            amount:"₹24,500",
            risk:"High",
            score:"99%",
            status:"Blocked"
        }

    ];

    tbody.innerHTML="";

    data.forEach(tx=>{

        let badge="safe";

        if(tx.risk==="High") badge="high";

        if(tx.risk==="Medium") badge="medium";

        tbody.innerHTML+=`

        <tr>

            <td>${tx.id}</td>

            <td>${tx.merchant}</td>

            <td>${tx.amount}</td>

            <td>

                <span class="badge ${badge}">

                    ${tx.risk}

                </span>

            </td>

            <td>${tx.status}</td>

            <td>${tx.score}</td>

        </tr>

        `;

    });

}
*/
/* ==========================================
   LIVE TOAST NOTIFICATION
========================================== */

function showToast(message,type="info"){

    let toast=document.createElement("div");

    toast.className=`toast ${type}`;

    toast.innerHTML=`

        <i class="fa-solid fa-bell"></i>

        <span>${message}</span>

    `;

    document.body.appendChild(toast);

    setTimeout(()=>{

        toast.classList.add("show");

    },100);

    setTimeout(()=>{

        toast.classList.remove("show");

        setTimeout(()=>{

            toast.remove();

        },400);

    },4000);

}

/* ==========================================
   AI ALERTS
========================================== */

const alerts=[

"⚠ High Risk Transaction Detected",

"🟢 AI Model Updated Successfully",

"🔍 Suspicious Merchant Found",

"💳 New Transaction Received",

"🧠 AI Fraud Scan Completed",

"✅ System Running Normally"

];

setInterval(()=>{

    const msg=alerts[
        Math.floor(Math.random()*alerts.length)
    ];

    showToast(msg);

},12000);
/* ==========================================
   SIDEBAR TOGGLE
========================================== */

const menuBtn = document.querySelector(".menu-btn");
const sidebar = document.querySelector(".sidebar");

if(menuBtn){

    menuBtn.addEventListener("click",()=>{

        sidebar.classList.toggle("collapsed");

    });

}

/* ==========================================
   DARK MODE
========================================== */

const themeBtn=document.querySelector(".fa-moon");

if(themeBtn){

themeBtn.parentElement.addEventListener("click",()=>{

document.body.classList.toggle("light-mode");

});

}

/* ==========================================
   BUTTON RIPPLE EFFECT
========================================== */

document.querySelectorAll("button,.primary-btn,.action-btn").forEach(btn=>{

btn.addEventListener("click",function(e){

const ripple=document.createElement("span");

const rect=this.getBoundingClientRect();

const size=Math.max(rect.width,rect.height);

ripple.style.width=size+"px";

ripple.style.height=size+"px";

ripple.style.left=(e.clientX-rect.left-size/2)+"px";

ripple.style.top=(e.clientY-rect.top-size/2)+"px";

ripple.className="ripple";

this.appendChild(ripple);

setTimeout(()=>{

ripple.remove();

},600);

});

});

/* ==========================================
   FADE IN ANIMATION
========================================== */

const observer=new IntersectionObserver((entries)=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

entry.target.classList.add("show");

}

});

});

document.querySelectorAll(

".glass-card,.stat-card,.hero-left,.hero-right"

).forEach(card=>{

card.classList.add("hidden");

observer.observe(card);

});
async function loadDashboard(){

    try{

        const response = await fetch("/dashboard/summary");

        const data = await response.json();

        console.log("Dashboard:",data);


        document.getElementById("totalTransactions").innerText =
            data.total_transactions;


        document.getElementById("highRisk").innerText =
            data.high_risk_transactions;


        document.getElementById("mediumRisk").innerText =
            data.fraud_transactions;


        document.getElementById("safeTransactions").innerText =
            data.total_transactions - data.fraud_transactions;


    }
    catch(error){

        console.log("Dashboard Error:",error);

    }

}

async function loadAIInsights(){

    try{

        const response = await fetch(
            "/dashboard/ai-insight"
        );


        const data = await response.json();


        const box = document.getElementById(
            "aiInsights"
        );


        if(data.message){

            box.innerHTML = `
                <div class="insight info">

                    <i class="fa-solid fa-robot"></i>

                    <div>
                        <strong>No AI Analysis</strong>
                        <p>${data.message}</p>
                    </div>

                </div>
            `;

            return;
        }



        box.innerHTML = `

        <div class="insight warning">

            <i class="fa-solid fa-triangle-exclamation"></i>

            <div>

                <strong>
                    ${data.prediction}
                    (${data.risk_level})
                </strong>


                <p>
                    Risk Score:
                    ${data.risk_score}%
                </p>


                <p>
                    Fraud Probability:
                    ${data.fraud_probability}%
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
                    ${data.reason}
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
                    ${data.recommendation}
                </p>

            </div>

        </div>

        `;


    }
    catch(error){

        console.log(
            "AI INSIGHT ERROR:",
            error
        );

    }

}



loadAIInsights();
/*async function loadSystem(){

    const res = await fetch("/api/dashboard/system");

    const system = await res.json();

    console.log(system);
*/






window.onload = () => {


    loadDashboard();


    initCharts();


    loadAI();


};


console.log("Dashboard JS Loaded");


document.addEventListener("DOMContentLoaded",()=>{

    console.log("DOM Loaded");


    const riskCanvas = document.getElementById(
        "riskDistributionChart"
    );

    const trendCanvas = document.getElementById(
        "fraudTrendChart"
    );


    console.log("Risk Canvas:", riskCanvas);

    console.log("Trend Canvas:", trendCanvas);


});
async function loadDashboardLive(){


    const response = await fetch(
        "/api/dashboard-live"
    );


    const data = await response.json();



    // AI PERFORMANCE

    const performance =
        data.performance;



    document.querySelector(
        ".performance-item:nth-child(1) h2"
    ).innerText =
        performance.detection_rate + "%";



    document.querySelector(
        ".performance-item:nth-child(3) h2"
    ).innerText =
        performance.total_transactions;



    document.querySelector(
        ".performance-item:nth-child(4) h2"
    ).innerText =
        performance.frauds_detected;



    // LIVE THREATS


    const feed =
        document.querySelector(
            ".activity-list"
        );


    feed.innerHTML="";



    data.threats.forEach(t=>{


        feed.innerHTML += `

        <div class="activity danger">

            <div class="dot red"></div>

            <div>

                <strong>
                ${t.merchant}
                </strong>


                <p>
                ₹${t.amount}
                blocked by AI
                </p>


                <small>
                ${t.time}
                </small>


            </div>

        </div>

        `;


    });


}



loadDashboardLive();
/* ==========================================
   REAL DASHBOARD DATA
========================================== */


async function loadDashboardLive(){


    try{


        const response = await fetch(
            "/api/dashboard-live"
        );


        const data = await response.json();



        console.log(
            "Live Dashboard:",
            data
        );



        /* =============================
           AI PERFORMANCE
        ============================= */


        const performanceItems =
        document.querySelectorAll(
            ".performance-item h2"
        );


        if(performanceItems.length >= 4){


            performanceItems[0].innerText =
            data.performance.detection_rate + "%";


           const avgElement =
document.getElementById("avgDetection");


if(avgElement){

    avgElement.innerText =
    data.performance.average_risk_score;

}


            performanceItems[2].innerText =
            data.performance.total_transactions;


            performanceItems[3].innerText =
            data.performance.frauds_detected;


        }





        /* =============================
           LIVE THREAT FEED
        ============================= */


        const feed =
        document.querySelector(
            ".activity-list"
        );


        if(feed){


            feed.innerHTML="";


            if(data.threats.length===0){


                feed.innerHTML=`

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


            }



            data.threats.forEach(t=>{


                feed.innerHTML += `


                <div class="activity danger">


                    <div class="dot red"></div>


                    <div>


                    <strong>
                    ${t.merchant}
                    </strong>


                    <p>
                    ₹${t.amount} 
                    - ${t.risk} Risk
                    </p>


                    <small>
                    ${t.time}
                    </small>


                    </div>


                </div>


                `;


            });


        }





        /* =============================
           RECENT TRANSACTIONS
        ============================= */


        loadRecentTransactions();



    }


    catch(error){


        console.log(
            "Live Dashboard Error:",
            error
        );


    }


}





async function loadRecentTransactions(){


    const tbody =
    document.getElementById(
        "recentTransactionsBody"
    );


    if(!tbody) return;



    try{


        const response =
        await fetch(
            "/api/recent-transactions"
        );


        const transactions =
        await response.json();



        tbody.innerHTML="";



        transactions.forEach(tx=>{


           let badge="safe";


if(tx.risk_level==="High")
    badge="high";


else if(tx.risk_level==="Medium")
    badge="medium";


else if(tx.risk_level==="Low")
    badge="low";



            tbody.innerHTML += `


            <tr>


            <td>
            ${tx.transaction_id}
            </td>


            <td>
            ${tx.merchant}
            </td>


            <td>
            ₹${tx.amount}
            </td>


            <td>

            <span class="badge ${badge}">

            ${tx.risk_level}

            </span>

            </td>


            <td>
            ${tx.prediction}
            </td>


            <td>
            ${tx.fraud_probability}%
            </td>


            </tr>


            `;



        });


    }

    catch(error){

        console.log(
            "Recent Transaction Error:",
            error
        );

    }


}

const ai =
data.ai_engine;


const accuracy =
document.getElementById(
"aiAccuracy"
);


if(accuracy){

    accuracy.innerText =
    ai.accuracy + "%";

}


const scan =
document.getElementById(
"aiLastScan"
);


if(scan){

    scan.innerText =
    ai.last_scan;

}



loadDashboardLive();