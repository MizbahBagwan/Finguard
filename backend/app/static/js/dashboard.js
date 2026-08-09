/* ==========================================
   FinGuard AI Dashboard
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    initClock();

    startAIStatus();

    initAI3D();

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



    console.log("NEW RISK FUNCTION RUNNING");

    const canvas=document.getElementById(
        "riskDistributionChart"
    );

    if(!canvas) return;


    const response = await fetch(
        "/dashboard/risk"
    );

    const data = await response.json();
    data.push({
    risk_level:"Medium",
    count:0
});
    console.log("Risk API Data:", data);

  


    const riskData = {

        High:0,
        Medium:0,
        Low:0

    };


   data.forEach(item=>{

    const level = item.risk_level.toLowerCase();


    if(level.includes("high")){

        riskData.High = item.count;

    }
    else if(level.includes("medium")){

        riskData.Medium = item.count;

    }
    else if(level.includes("low") || level.includes("safe")){

        riskData.Low = item.count;

    }

});

console.log(riskData);



    const labels=[

        "High Risk",
        "Medium Risk",
        "Low Risk"

    ];
    if(riskData.Medium === 0){
    riskData.Medium = 1;
}

    const values=[

        riskData.High,
        riskData.Medium,
        riskData.Low

    ];



    new Chart(canvas,{

        type:"doughnut",


        data:{


            labels:labels,


            datasets:[{

                data:values,


                backgroundColor:[

                    "#EF4444",
                    "#F59E0B",
                    "#22C55E"

                ],


                borderColor:[

                    "#ff7b7b",
                    "#ffd166",
                    "#4ade80"

                ],


                borderWidth:2,


                hoverOffset:20


            }]


        },


        options:{


            responsive:true,


            maintainAspectRatio:false,


            cutout:"75%",



            animation:{


                animateRotate:true,

                duration:1500


            },



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


                borderColor:"#00D4FF",


                backgroundColor:
                "rgba(0,212,255,0.12)",


                borderWidth:3,


                pointRadius:4,


                pointHoverRadius:8,


                pointBackgroundColor:"#00D4FF",


                pointBorderColor:"#ffffff",


                pointBorderWidth:2,


                fill:true,


                tension:.45


            }]


        },


        options:{


            responsive:true,


            maintainAspectRatio:false,


            animation:{


                duration:1500,


                easing:"easeOutQuart"


            },


            plugins:{


                legend:{


                    labels:{


                        color:"#94A3B8"


                    }


                }


            },


            scales:{


                x:{


                    ticks:{


                        color:"#94A3B8"


                    },


                    grid:{


                        display:false


                    }


                },


                y:{


                    ticks:{


                        color:"#94A3B8"


                    },


                    grid:{


                        color:
                        "rgba(148,163,184,0.12)"


                    }


                }


            }


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
    initAIRiskChart();

  


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
    

// =============================
// 3D AI CORE DATA
// =============================

const accuracy =
    document.getElementById("coreAccuracy");

const threats =
    document.getElementById("coreThreats");

const transactions =
    document.getElementById("coreTransactions");


if (accuracy) {
    accuracy.innerText =
        data.performance.detection_rate;
}

if (threats) {
    threats.innerText =
        data.performance.frauds_detected;
}

if (transactions) {
    transactions.innerText =
        data.performance.total_transactions;
}


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

/* ==========================================================
   LIVE 3D AI SECURITY CORE
   STEP 4 — THREE.JS
   ========================================================== */

function initAI3D() {

    const container = document.getElementById("ai3DScene");

    if (!container || typeof THREE === "undefined") {
        console.log("3D Scene unavailable");
        return;
    }

    /* =========================
       SCENE
       ========================= */

    const scene = new THREE.Scene();

    scene.fog = new THREE.FogExp2(0x070B14, 0.0018);


    /* =========================
       CAMERA
       ========================= */

    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );

    camera.position.set(0, 0, 8);


    /* =========================
       RENDERER
       ========================= */

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );

    renderer.setSize(
        container.clientWidth,
        container.clientHeight
    );

    renderer.outputEncoding = THREE.sRGBEncoding;

    container.appendChild(renderer.domElement);


    /* =========================
       MAIN AI CORE
       ========================= */

    const coreGroup = new THREE.Group();

    scene.add(coreGroup);


    /* =========================
       GLOWING CORE
       ========================= */

    const coreGeometry =
        new THREE.IcosahedronGeometry(1.15, 3);

    const coreMaterial =
        new THREE.MeshBasicMaterial({
            color: 0x00D4FF,
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });

    const core =
        new THREE.Mesh(
            coreGeometry,
            coreMaterial
        );

    coreGroup.add(core);


    /* =========================
       INNER CORE
       ========================= */

    const innerGeometry =
        new THREE.IcosahedronGeometry(.65, 2);

    const innerMaterial =
        new THREE.MeshBasicMaterial({
            color: 0x2563EB,
            wireframe: true,
            transparent: true,
            opacity: 0.9
        });

    const innerCore =
        new THREE.Mesh(
            innerGeometry,
            innerMaterial
        );

    coreGroup.add(innerCore);


    /* =========================
       ORBIT RINGS
       ========================= */

    const rings = [];

    const ringData = [
        {
            radius: 1.65,
            rotation: [0.4, 0.2, 0]
        },
        {
            radius: 1.95,
            rotation: [1.2, 0.5, 0.4]
        },
        {
            radius: 2.25,
            rotation: [0.3, 1.2, 0.8]
        }
    ];


    ringData.forEach((data, incex) => {

        const geometry =
            new THREE.TorusGeometry(
                data.radius,
                0.012,
                16,
                120
            );

        const material =
            new THREE.MeshBasicMaterial({
                color:
                    index === 1
                        ? 0x00D4FF
                        : 0x4F8CFF,

                transparent: true,

                opacity: .65
            });

        const ring =
            new THREE.Mesh(
                geometry,
                material
            );

        ring.rotation.set(
            data.rotation[0],
            data.rotation[1],
            data.rotation[2]
        );

        coreGroup.add(ring);

        rings.push(ring);

    });


    /* =========================
       PARTICLES
       ========================= */

    const particleCount = 700;

    const particleGeometry =
        new THREE.BufferGeometry();

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
            2.2 + Math.random() * 2.8;

        const theta =
            Math.random() * Math.PI * 2;

        const phi =
            Math.acos(
                2 * Math.random() - 1
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

    particleGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(
            positions,
            3
        )
    );


    const particleMaterial =
        new THREE.PointsMaterial({

            color: 0x00D4FF,

            size: .025,

            transparent: true,

            opacity: .7,

            sizeAttenuation: true

        });


    const particles =
        new THREE.Points(
            particleGeometry,
            particleMaterial
        );

    scene.add(particles);


    /* =========================
       MOUSE PARALLAX
       ========================= */

    let mouseX = 0;
    let mouseY = 0;

    container.addEventListener(
        "mousemove",
        (event) => {

            const rect =
                container.getBoundingClientRect();

            mouseX =
                ((event.clientX - rect.left)
                    / rect.width - .5);

            mouseY =
                ((event.clientY - rect.top)
                    / rect.height - .5);

        }
    );


    /* =========================
       ANIMATION
       ========================= */

    const clock =
        new THREE.Clock();


    function animate() {

        requestAnimationFrame(
            animate
        );

        const time =
            clock.getElapsedTime();


        /* Core rotation */

        core.rotation.x =
            time * .22;

        core.rotation.y =
            time * .35;


        innerCore.rotation.x =
            -time * .4;

        innerCore.rotation.y =
            -time * .25;


        /* Orbit rings */

        rings[0].rotation.z =
            time * .45;

        rings[1].rotation.x =
            time * .35;

        rings[1].rotation.z =
            -time * .25;

        rings[2].rotation.y =
            time * .3;

        rings[2].rotation.z =
            time * .18;


        /* Particle rotation */

        particles.rotation.y =
            time * .035;

        particles.rotation.x =
            time * .015;


        /* Floating effect */

        coreGroup.position.y =
            Math.sin(time * 1.2) * .08;


        /* Mouse movement */

        coreGroup.rotation.y +=
            (mouseX * .35 -
             coreGroup.rotation.y) * .015;

        coreGroup.rotation.x +=
            (-mouseY * .25 -
             coreGroup.rotation.x) * .015;


        renderer.render(
            scene,
            camera
        );

    }


    animate();


    /* =========================
       RESPONSIVE
       ========================= */

    function resize3D() {

        const width =
            container.clientWidth;

        const height =
            container.clientHeight;

        if (!width || !height) return;

        camera.aspect =
            width / height;

        camera.updateProjectionMatrix();

        renderer.setSize(
            width,
            height
        );

    }


    window.addEventListener(
        "resize",
        resize3D
    );


    resize3D();


    console.log(
        "3D AI Security Core Loaded"
    );
}


/* Start 3D */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initAI3D();

    }
);
/* ==========================================================
   FIN GUARD AI - 3D SECURITY CORE
   ========================================================== */

function initAI3D() {

    const container = document.getElementById("ai3DScene");

    if (!container) {
        console.log("3D container not found");
        return;
    }

    if (typeof THREE === "undefined") {
        console.error("Three.js is not loaded");
        return;
    }

    console.log("Starting FinGuard 3D Core...");


    /* ======================================================
       SCENE
    ====================================================== */

    const scene = new THREE.Scene();

    scene.background = new THREE.Color(0x06111f);


    /* ======================================================
       CAMERA
    ====================================================== */

    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        100
    );

    camera.position.set(0, 0, 6);


    /* ======================================================
       RENDERER
    ====================================================== */

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );

    renderer.setSize(
        container.clientWidth,
        container.clientHeight
    );

    renderer.outputColorSpace =
        THREE.SRGBColorSpace;

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

    scene.add(ambientLight);


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

    scene.add(pointLight);


    /* ======================================================
       MAIN AI CORE
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

    scene.add(core);


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

    scene.add(innerCore);


    /* ======================================================
       ROTATING RINGS
       ====================================================== */

    const ringGroup =
        new THREE.Group();

    scene.add(ringGroup);


    for (let i = 0; i < 3; i++) {

        const ringGeometry =
            new THREE.TorusGeometry(
                1.55 + i * 0.18,
                0.025,
                16,
                100
            );

        const ringMaterial =
            new THREE.MeshBasicMaterial({
                color: 0x00d4ff,
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

        ringGroup.add(ring);
    }


    /* ======================================================
       PARTICLES
       ====================================================== */

    const particleCount = 700;

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
            2.2 + Math.random() * 2.5;

        const theta =
            Math.random() * Math.PI * 2;

        const phi =
            Math.acos(
                2 * Math.random() - 1
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

            opacity: 0.8

        });


    const particles =
        new THREE.Points(
            particleGeometry,
            particleMaterial
        );

    scene.add(particles);


    /* ======================================================
       MOUSE INTERACTION
       ====================================================== */

    let mouseX = 0;
    let mouseY = 0;

    container.addEventListener(
        "mousemove",
        (event) => {

            const rect =
                container.getBoundingClientRect();

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


        /* Main core */

        core.rotation.x =
            time * 0.25;

        core.rotation.y =
            time * 0.4;


        /* Inner core */

        innerCore.rotation.x =
            -time * 0.3;

        innerCore.rotation.y =
            -time * 0.5;


        /* Rings */

        ringGroup.rotation.y =
            time * 0.35;

        ringGroup.rotation.x =
            Math.sin(time * 0.4) * 0.3;


        /* Particles */

        particles.rotation.y =
            time * 0.04;

        particles.rotation.x =
            time * 0.02;


        /* Floating effect */

        const float =
            Math.sin(time * 1.5) * 0.08;

        core.position.y = float;

        innerCore.position.y = float;


        /* Mouse movement */

        core.rotation.y +=
            mouseX * 0.01;

        core.rotation.x +=
            mouseY * 0.01;


        renderer.render(
            scene,
            camera
        );

    }

    animate();


    /* ======================================================
       RESIZE
       ====================================================== */

    window.addEventListener(
        "resize",
        () => {

            const width =
                container.clientWidth;

            const height =
                container.clientHeight;

            if (
                width === 0 ||
                height === 0
            ) return;


            camera.aspect =
                width / height;

            camera.updateProjectionMatrix();


            renderer.setSize(
                width,
                height
            );

        }
    );


    console.log(
        "FinGuard 3D Core Started"
    );
}
// ==========================================
// AI RISK INTELLIGENCE CHART
// ==========================================

function initAIRiskChart(){

    const canvas = document.getElementById(
        "aiRiskChart"
    );

    if(!canvas) return;


    new Chart(canvas,{

        type:"line",

        data:{

            labels:[
                "10 AM",
                "11 AM",
                "12 PM",
                "1 PM",
                "2 PM",
                "3 PM"
            ],


            datasets:[{


                label:"AI Risk Score",


                data:[
                    22,
                    35,
                    28,
                    65,
                    45,
                    30
                ],


                borderColor:"#00D4FF",

                backgroundColor:
                "rgba(0,212,255,0.15)",


                borderWidth:3,


                fill:true,


                tension:0.45,


                pointRadius:5,


                pointBackgroundColor:"#00D4FF"


            }]

        },


        options:{


            responsive:true,


            maintainAspectRatio:false,


            plugins:{


                legend:{


                    labels:{


                        color:"#94A3B8"


                    }


                }


            },


            scales:{


                x:{


                    ticks:{


                        color:"#64748B"


                    },


                    grid:{


                        display:false


                    }


                },


                y:{


                    beginAtZero:true,


                    max:100,


                    ticks:{


                        color:"#64748B"


                    },


                    grid:{


                        color:"rgba(255,255,255,.05)"


                    }


                }


            }


        }


    });


}

loadDashboardLive();