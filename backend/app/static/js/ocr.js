/* =====================================================
   FinGuard AI - OCR Module
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    initializeOCR();

});

function initializeOCR(){

    bindEvents();
    animateCards();
    initializeRiskMeter();

}

/* =====================================================
   EVENT BINDINGS
===================================================== */

function bindEvents(){

    const uploadInput = document.getElementById("ocrFile");
    const analyzeBtn = document.getElementById("analyzeBtn");
    const copyBtn = document.getElementById("copyBtn");
    const clearBtn = document.getElementById("clearBtn");
    const exportBtn = document.getElementById("exportBtn");

    if(uploadInput){
        uploadInput.addEventListener("change", handleFileSelect);
    }

    if(analyzeBtn){
        analyzeBtn.addEventListener("click", runAnalysis);
    }

    if(copyBtn){
        copyBtn.addEventListener("click", copyResult);
    }

    if(clearBtn){
        clearBtn.addEventListener("click", clearOCR);
    }

    if(exportBtn){
        exportBtn.addEventListener("click", exportText);
    }

}

/* =====================================================
   CARD ANIMATION
===================================================== */

function animateCards(){

    document.querySelectorAll(".metric-card,.card,.glass").forEach((item,index)=>{

        item.style.opacity="0";
        item.style.transform="translateY(20px)";

        setTimeout(()=>{

            item.style.transition=".45s";
            item.style.opacity="1";
            item.style.transform="translateY(0)";

        },120*index);

    });

}

/* =====================================================
   FILE SELECT
===================================================== */

function handleFileSelect(e){

    const file = e.target.files[0];

    if(!file) return;

    // Preview
    const preview = document.getElementById("previewImage");

    if(preview){
        preview.src = URL.createObjectURL(file);
        preview.style.display = "block";
    }

    // File Size
    const fileSize = document.getElementById("fileSize");

    if(fileSize){

        let size;

        if(file.size < 1024*1024){

            size = (file.size/1024).toFixed(2) + " KB";

        }else{

            size = (file.size/(1024*1024)).toFixed(2) + " MB";

        }

        fileSize.innerText = size;
    }

    // Reset previous result
    document.getElementById("ocrText").value = "";

    document.getElementById("amount").innerText = "--";

    document.getElementById("riskScore").innerText = "0%";

    document.getElementById("riskLevel").innerText = "Safe";

    document.getElementById("keywordCount").innerText = "0";

    document.getElementById("confidenceValue").innerText = "0%";

    document.getElementById("recommendation").innerText =
        "Click Scan With AI to analyze this document.";

    document.getElementById("keywordList").innerHTML = "";

    updateRiskMeter(0);

}
/* =====================================================
   UPLOAD PROGRESS
===================================================== */

function simulateUpload() {

    const progress = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");

    if (!progress) return;

    progress.style.width = "0%";

    if (progressText) {
        progressText.innerText = "Starting OCR...";
    }

    let value = 0;

    const timer = setInterval(() => {

        value += 2;

        progress.style.width = value + "%";

        if (progressText) {

            if (value < 25) {

                progressText.innerText = "Uploading Image...";

            } else if (value < 50) {

                progressText.innerText = "Extracting Text...";

            } else if (value < 75) {

                progressText.innerText = "Running AI Analysis...";

            } else if (value < 100) {

                progressText.innerText = "Generating Report...";

            } else {

                progressText.innerText = "Analysis Completed";

            }

        }

        if (value >= 100) {

            clearInterval(timer);

            progress.style.width = "100%";

            activateSteps();

        }

    }, 25);

}

document.addEventListener("DOMContentLoaded", function () {

    const copyBtn = document.getElementById("copyText");
    const downloadBtn = document.getElementById("downloadReport");
    const resetBtn = document.getElementById("resetOCR");


    if (copyBtn) {
        copyBtn.addEventListener("click", function () {

            const textArea = document.getElementById("ocrText");

            if (textArea) {
                navigator.clipboard.writeText(textArea.value);

                alert("OCR Text Copied!");
            }

        });
    }


    if (resetBtn) {
        resetBtn.addEventListener("click", function () {

            const textArea = document.getElementById("ocrText");

            if (textArea) {
                textArea.value = "";
            }

            alert("OCR Reset Done!");

        });
    }


    if (downloadBtn) {
        downloadBtn.addEventListener("click", function () {

            alert("Report Export Started!");

        });
    }

});

/* =====================================================
   AI PROCESS STEPS
===================================================== */

function activateSteps(){

    const steps=document.querySelectorAll(".step");

    steps.forEach(step=>{
        step.classList.remove("active","completed");
    });

    let index=0;

    const timer=setInterval(()=>{

        if(index>0){
            steps[index-1].classList.remove("active");
            steps[index-1].classList.add("completed");
        }

        if(index<steps.length){

            steps[index].classList.add("active");
            index++;

        }else{

            clearInterval(timer);

            setTimeout(()=>{
                updateRiskMeter(78);
            },400);

        }

    },700);

}

/* =====================================================
   RISK METER
===================================================== */

function initializeRiskMeter(){

    updateRiskMeter(0);

}

function updateRiskMeter(value){

    const circle=document.querySelector(".progress-circle");
    const score=document.getElementById("riskScore");
    const level=document.getElementById("riskLevel");

    if(!circle) return;

    const circumference=302;

    const offset=circumference-(value/100)*circumference;

    circle.style.strokeDashoffset=offset;

    if(score){
        score.innerText=value+"%";
    }

    if(level){

        if(value<35){

            level.innerText="LOW";
            circle.style.stroke="#22c55e";

        }else if(value<70){

            level.innerText="MEDIUM";
            circle.style.stroke="#f59e0b";

        }else{

            level.innerText="HIGH";
            circle.style.stroke="#ef4444";

        }

    }

}

/* =====================================================
   ANALYSIS
===================================================== */

/* =====================================================
   REAL OCR API
===================================================== */

async function runAnalysis() {

    const fileInput = document.getElementById("ocrFile");

    if (!fileInput.files.length) {

        showToast("Please select an image first.", "warning");
        return;

    }

    const btn = document.getElementById("analyzeBtn");

    btn.disabled = true;

    btn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Scanning...';

    simulateUpload();

    const formData = new FormData();

    formData.append("file", fileInput.files[0]);

    try {

        const response = await fetch("/api/ocr", {

            method: "POST",

            body: formData

        });

        const data = await response.json();

        btn.disabled = false;

        btn.innerHTML =
            '<i class="fa-solid fa-wand-magic-sparkles"></i> Scan With AI';

        if (!data.success) {

            showToast(data.error, "error");
            return;

        }

        updateUI(data);

        showToast("OCR Analysis Completed");

    }

    catch (err) {

        console.error(err);

        btn.disabled = false;

        btn.innerHTML =
            '<i class="fa-solid fa-wand-magic-sparkles"></i> Scan With AI';

        showToast("Server Error", "error");

    }

}
/* =====================================================
   SHOW OCR RESULT
===================================================== */

function showResult(){

    const output=document.getElementById("ocrText");

    if(output){

        output.value=`Transaction Receipt

Amount : ₹25,499
Merchant : ABC Electronics
Date : 05 Aug 2026
Location : Pune

AI Analysis:
• High-value transaction detected.
• Merchant appears legitimate.
• No duplicate transaction found.
• Location matches previous activity.

Recommendation:
Transaction appears safe but should be verified if unexpected.`;

    }

    generateKeywords();

}

/* =====================================================
   AI KEYWORDS
===================================================== */

function generateKeywords(){

    const container=document.getElementById("keywordList");

    if(!container) return;

    const keywords=[
        "Transaction",
        "Verified",
        "Merchant",
        "Receipt",
        "Safe",
        "Risk",
        "AI",
        "Amount"
    ];

    container.innerHTML="";

    keywords.forEach((word,index)=>{

        const chip=document.createElement("span");

        chip.className="keyword-chip";

        chip.textContent=word;

        chip.style.opacity="0";
        chip.style.transform="translateY(10px)";

        container.appendChild(chip);

        setTimeout(()=>{
            chip.style.transition=".3s";
            chip.style.opacity="1";
            chip.style.transform="translateY(0)";
        },index*80);

    });

}

/* =====================================================
   COPY RESULT
===================================================== */

async function copyResult(){

    const text = document.getElementById("ocrText").value;

    if(!text.trim()){

        showToast("No OCR text available.","warning");
        return;

    }

    try{

        await navigator.clipboard.writeText(text);

        showToast("Text copied successfully.");

    }catch{

        showToast("Copy failed.","error");

    }

}
/* =====================================================
   EXPORT TXT
===================================================== */

function exportText(){

    const text=document.getElementById("ocrText").value;

    if(!text.trim()){

        showToast("No OCR result.","warning");
        return;

    }

    const report=`

=============================
        FinGuard AI OCR Report
=============================

Amount : ${document.getElementById("amount").innerText}

Risk Score : ${document.getElementById("riskScore").innerText}

Risk Level : ${document.getElementById("riskLevel").innerText}

Confidence : ${document.getElementById("confidenceValue").innerText}

Recommendation :
${document.getElementById("recommendation").innerText}

-------------------------------------

Extracted Text

-------------------------------------

${text}

`;

    const blob=new Blob([report],{type:"text/plain"});

    const url=URL.createObjectURL(blob);

    const a=document.createElement("a");

    a.href=url;

    a.download="FinGuard_OCR_Report.txt";

    a.click();

    URL.revokeObjectURL(url);

    showToast("Report exported.");

}

/* =====================================================
   CLEAR
===================================================== */

function clearOCR(){

    document.getElementById("ocrFile").value="";

    document.getElementById("previewImage").src="";

    document.getElementById("ocrText").value="";

    document.getElementById("amount").innerText="--";

    document.getElementById("fileSize").innerText="--";

    document.getElementById("riskScore").innerText="0%";

    document.getElementById("riskLevel").innerText="Safe";

    document.getElementById("confidenceValue").innerText="0%";

    document.getElementById("keywordCount").innerText="0";

    document.getElementById("recommendation").innerText=
        "Upload a receipt, invoice or bank statement to begin OCR analysis.";

    document.getElementById("keywordList").innerHTML="";

    document.getElementById("confidenceFill").style.width="0%";

    document.getElementById("progressBar").style.width="0%";

    document.getElementById("progressText").innerText="Waiting...";

    document.querySelectorAll(".step").forEach(step=>{

        step.classList.remove("completed","active");

    });

    document.querySelector(".step").classList.add("active");

    updateRiskMeter(0);

    showToast("OCR reset completed.");

}
/* =====================================================
   TOAST
===================================================== */

function showToast(message,type="success"){

    const toast=document.createElement("div");

    toast.className="ocr-toast";

    toast.textContent=message;

    toast.style.position="fixed";
    toast.style.right="25px";
    toast.style.bottom="25px";
    toast.style.padding="14px 20px";
    toast.style.borderRadius="12px";
    toast.style.color="#fff";
    toast.style.fontWeight="600";
    toast.style.zIndex="9999";
    toast.style.opacity="0";
    toast.style.transition=".3s";

    if(type==="success"){
        toast.style.background="#16a34a";
    }else if(type==="warning"){
        toast.style.background="#f59e0b";
    }else{
        toast.style.background="#dc2626";
    }

    document.body.appendChild(toast);

    requestAnimationFrame(()=>{
        toast.style.opacity="1";
    });

    setTimeout(()=>{
        toast.style.opacity="0";
        setTimeout(()=>{
            toast.remove();
        },300);
    },2500);

}
/* =====================================================
   UPDATE UI
===================================================== */

function updateUI(data){

    document.getElementById("ocrText").value =
        data.text || "";

    document.getElementById("amount").innerText =
        data.amount || "--";

    document.getElementById("riskScore").innerText =
        (data.risk_score || 0) + "%";

    document.getElementById("riskLevel").innerText =
        data.risk_level || "Safe";

    document.getElementById("confidenceValue").innerText =
        (data.confidence || 0) + "%";

    document.getElementById("recommendation").innerText =
        data.recommendation || "--";

    document.getElementById("keywordCount").innerText =
        data.keyword_count || 0;

    updateRiskMeter(data.risk_score || 0);

    updateConfidence(data.confidence || 0);

    loadKeywords(data.keywords || []);

}
function updateConfidence(value){

    const fill =
        document.getElementById("confidenceFill");

    if(fill){

        fill.style.width = value + "%";

    }

}
function loadKeywords(keywords){

    const container =
        document.getElementById("keywordList");

    if(!container) return;

    container.innerHTML="";

    keywords.forEach(word=>{

        const chip=document.createElement("span");

        chip.className="keyword-chip";

        chip.innerText=word;

        container.appendChild(chip);

    });

}