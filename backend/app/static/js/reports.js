// ==========================================
// FinGuard AI Reports Dashboard
// reports.js
// ==========================================



document.addEventListener(
"DOMContentLoaded",
()=>{



const reportBody =
document.getElementById("reportBody");


const searchInput =
document.getElementById("searchInput");


const riskFilter =
document.getElementById("riskFilter");


const statusFilter =
document.getElementById("statusFilter");


const applyFilterBtn =
document.getElementById("applyFilterBtn");


const refreshBtn =
document.getElementById("refreshBtn");


const generateBtn =
document.getElementById("generateReportBtn");


const exportBtn =
document.getElementById("exportReportBtn");



let chart;





// ==========================================
// UPDATE STATISTICS
// ==========================================


function updateStatistics(){


let high = 0;
let medium = 0;
let low = 0;



document.querySelectorAll(
"#reportBody tr"
)
.forEach(row=>{


let risk =
row.children[2]?.innerText.trim();



if(risk==="High" || risk==="Critical")
high++;


else if(risk==="Medium")
medium++;


else if(risk==="Low")
low++;



});





document.getElementById(
"totalReports"
).innerText =
document.querySelectorAll(
"#reportBody tr"
).length;



document.getElementById(
"highRisk"
).innerText =
high;



document.getElementById(
"mediumRisk"
).innerText =
medium;



document.getElementById(
"lowRisk"
).innerText =
low;



updateChart(
high,
medium,
low
);



}





// ==========================================
// AI RISK CHART
// ==========================================


function updateChart(
high,
medium,
low
){



const ctx =
document.getElementById(
"riskChart"
);



if(!ctx)
return;



if(chart)
chart.destroy();




chart =
new Chart(
ctx,
{

type:"doughnut",


data:{


labels:[

"High Risk",

"Medium Risk",

"Low Risk"

],


datasets:[{

data:[

high,

medium,

low

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


}

);



}








// ==========================================
// SEARCH
// ==========================================


function searchReports(){



let value =
searchInput.value
.toLowerCase();



document.querySelectorAll(
"#reportBody tr"
)
.forEach(row=>{



let text =
row.innerText
.toLowerCase();



row.style.display =
text.includes(value)
?
""
:
"none";



});



}






// ==========================================
// FILTER
// ==========================================


function filterReports(){



let risk =
riskFilter.value;


let status =
statusFilter.value;




document.querySelectorAll(
"#reportBody tr"
)
.forEach(row=>{



let rowRisk =
row.children[2]
.innerText
.trim();



let rowStatus =
row.children[5]
.innerText
.trim();



let riskMatch =
!risk ||
rowRisk===risk;



let statusMatch =
!status ||
rowStatus===status;



row.style.display =
(
riskMatch &&
statusMatch
)
?
""
:
"none";



});



}







// ==========================================
// VIEW REPORT
// ==========================================


document.querySelectorAll(
".view"
)
.forEach(button=>{


button.onclick=()=>{



let row =
button.closest("tr");



let content = `

<h3>
${row.children[1].innerText}
</h3>


<p>
<b>Risk:</b>
${row.children[2].innerText}
</p>


<p>
<b>AI Score:</b>
${row.children[3].innerText}
</p>


<p>
<b>Date:</b>
${row.children[4].innerText}
</p>


<p>
<b>Status:</b>
${row.children[5].innerText}
</p>


<hr>


<p>

AI analysis completed successfully.
The system detected transaction patterns
using fraud intelligence models.

</p>

`;



document.getElementById(
"modalReportContent"
).innerHTML =
content;



document.getElementById(
"reportModal"
).style.display =
"flex";



};



});








// ==========================================
// CLOSE MODAL
// ==========================================



const closeModal =
document.querySelector(
".close-modal"
);



if(closeModal){


closeModal.onclick=()=>{


document.getElementById(
"reportModal"
).style.display =
"none";


};


}






// ==========================================
// DELETE REPORT
// ==========================================


document.querySelectorAll(
".delete"
)
.forEach(button=>{


button.onclick=()=>{



let row =
button.closest("tr");



if(
confirm(
"Delete this report?"
)
){


row.remove();


updateStatistics();


}


};



});








// ==========================================
// DOWNLOAD REPORT
// ==========================================


document.querySelectorAll(
".download"
)
.forEach(button=>{


button.onclick=()=>{


let row =
button.closest("tr");



let data =

`
FinGuard AI Investigation Report

Report:
${row.children[1].innerText}


Risk:
${row.children[2].innerText}


AI Score:
${row.children[3].innerText}


Date:
${row.children[4].innerText}


Status:
${row.children[5].innerText}

`;




let file =
new Blob(
[data],
{
type:"text/plain"
}
);



let link =
document.createElement("a");



link.href =
URL.createObjectURL(file);



link.download =
"FinGuard_Report.txt";



link.click();



};


});









// ==========================================
// GENERATE REPORT
// ==========================================


if(generateBtn){


generateBtn.onclick=()=>{



let id =
Date.now();



let row =
document.createElement(
"tr"
);



row.innerHTML = `


<td>
#${id}
</td>


<td>

<div class="report-info">

<h4>
AI Fraud Investigation
</h4>

<small>
Generated Report
</small>

</div>

</td>



<td>

<span class="badge High">

High

</span>

</td>



<td>

<div class="score-box">

<div class="score-bar">

<span style="width:92%">
</span>

</div>


<strong>
92%
</strong>


</div>

</td>



<td>

${new Date().toLocaleDateString()}

</td>



<td>

<span class="status completed">

Completed

</span>

</td>



<td>


<button class="icon-btn view">

<i class="ri-eye-line"></i>

</button>


<button class="icon-btn download">

<i class="ri-download-line"></i>

</button>


<button class="icon-btn delete">

<i class="ri-delete-bin-line"></i>

</button>


</td>


`;



reportBody.prepend(row);



alert(
"AI Investigation Report Generated"
);



location.reload();


};


}






// ==========================================
// REFRESH
// ==========================================


if(refreshBtn){


refreshBtn.onclick=()=>{


location.reload();


};


}






// ==========================================
// EXPORT PDF
// ==========================================


if(exportBtn){


exportBtn.onclick=()=>{


window.print();


};


}






// EVENTS


if(searchInput)

searchInput.addEventListener(
"input",
searchReports
);



if(applyFilterBtn)

applyFilterBtn.onclick =
filterReports;




updateStatistics();



});