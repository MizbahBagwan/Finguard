document.addEventListener("DOMContentLoaded", function(){


console.log("FinGuard AI JS Loaded");


// =============================
// AI DETECTION BUTTON
// =============================


const aiBtn = document.getElementById("aiDetectBtn");


if(aiBtn){


aiBtn.addEventListener("click", async function(){


console.log("AI Button Clicked");


aiBtn.innerHTML =
`
<i class="fa-solid fa-spinner fa-spin"></i>
Analyzing...
`;


aiBtn.disabled=true;



try{


let amount =
document.getElementById("amount").value;



let location =
document.getElementById("location").value;



let card =
document.getElementById("card").value;



let failed =
document.getElementById("failedAttempts").value;



let risk =
document.getElementById("locationRisk").value;



const response =
await fetch("/predict",
{


method:"POST",

headers:{
"Content-Type":"application/json"
},


body:JSON.stringify({

amount:amount,

location:location,

card_type:card,

failed_attempts:failed,

location_risk:risk

})


});



const data =
await response.json();


console.log(data);



// =============================
// SCORE UPDATE
// =============================


let score =
data.fraud_probability ||
data.risk_score ||
data.confidence ||
10;



if(score < 1){

score = score*100;

}



document.getElementById("riskScore")
.innerHTML =
score.toFixed(1)+"%";



document.getElementById("riskBar")
.style.width =
score+"%";




// =============================
// RISK LEVEL
// =============================


let badge =
document.getElementById("riskLevel");



if(score >=70){


badge.innerHTML="HIGH RISK";

badge.className="risk-badge high";


}

else if(score>=40){


badge.innerHTML="MEDIUM RISK";

badge.className="risk-badge medium";


}

else{


badge.innerHTML="SAFE";

badge.className="risk-badge safe";


}




document.getElementById("aiRecommendation")
.innerHTML =
`
AI Analysis Completed ✅
<br>
Risk calculated successfully.
`;



}

catch(error){


console.log(error);


alert(
"Prediction API Error"
);


}



aiBtn.disabled=false;


aiBtn.innerHTML =
`
<i class="fa-solid fa-brain"></i>
Run AI Detection
`;



});


}



// =============================
// RESET BUTTON
// =============================


const resetBtn =
document.getElementById("resetBtn");



if(resetBtn){


resetBtn.addEventListener("click",function(){



document.getElementById("riskScore")
.innerHTML="12%";



document.getElementById("riskBar")
.style.width="12%";



document.getElementById("riskLevel")
.innerHTML="SAFE";


document.getElementById("riskLevel")
.className="risk-badge safe";



document.getElementById("aiRecommendation")
.innerHTML=
`
Transaction appears safe.
AI monitoring will update automatically.
`;



});


}



});





// =============================
// REAL TIME ANALYSIS
// =============================


function showRealtimeStatus(){



let msg =
document.getElementById(
"aiRecommendation"
);



if(msg){


msg.innerHTML =
`
<i class="fa-solid fa-bolt"></i>

Real-Time Analysis Active ⚡

<br>

FinGuard AI monitoring transaction live.
`;

}



}
function showRealtimeStatus(){

    let msg = document.getElementById(
        "aiRecommendation"
    );


    if(msg){

        msg.innerHTML = `
        <i class="fa-solid fa-bolt"></i>
        Real-Time Analysis Active ⚡
        <br>
        FinGuard AI monitoring transaction live.
        `;

    }

}