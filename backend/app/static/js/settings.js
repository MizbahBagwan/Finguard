alert("SETTINGS JS RUNNING");
const STORAGE_KEY = "finguard_settings";


document.addEventListener("DOMContentLoaded", () => {

    console.log("FinGuard Settings JS Loaded");

    initializeSettings();

    registerEvents();

    loadSettings();

});



/* ============================
   INITIALIZE
============================ */

function initializeSettings(){

    updateLastSaved();

    updateRiskValue();

}



/* ============================
   EVENTS
============================ */

function registerEvents(){


    // Save buttons

    document
    .getElementById("saveAllSettingsBtn")
    ?.addEventListener(
        "click",
        saveSettings
    );


    document
    .getElementById("resetSettingsBtn")
    ?.addEventListener(
        "click",
        resetSettings
    );



    // Profile

    document
    .getElementById("editProfileBtn")
    ?.addEventListener(
        "click",
        ()=>{

            window.location.href="/profile/edit";

        }
    );



    // Password

    document
    .getElementById("changePasswordBtn")
    ?.addEventListener(
        "click",
        ()=>{

            window.location.href="/change-password";

        }
    );



    // Risk slider

    document
    .getElementById("riskThreshold")
    ?.addEventListener(
        "input",
        updateRiskValue
    );


}



/* ============================
   SAVE SETTINGS
============================ */


async function saveSettings(){


    const data = collectSettings();



    // Local save

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );



    try{


        const response = await fetch(
            "/api/settings/save",
            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },


                body:JSON.stringify(data)

            }
        );



        const result = await response.json();



        updateStatus("Saved");

        updateLastSaved();



        showToast(
            result.message,
            "success"
        );



    }

    catch(error){


        console.error(error);


        showToast(
            "Settings save failed",
            "error"
        );


    }


}





/* ============================
   COLLECT SETTINGS
============================ */


function collectSettings(){


    const data={};



    document
    .querySelectorAll(
        "input,select"
    )
    .forEach(element=>{


        if(element.type==="checkbox"){

            data[element.id]=element.checked;

        }

        else{

            data[element.id]=element.value;

        }


    });



    return data;


}





/* ============================
   LOAD SETTINGS
============================ */


function loadSettings(){


    const data = JSON.parse(

        localStorage.getItem(
            STORAGE_KEY
        )

    );



    if(!data)
        return;



    Object.keys(data)
    .forEach(key=>{


        const element =
        document.getElementById(key);



        if(!element)
            return;



        if(element.type==="checkbox"){

            element.checked=data[key];

        }

        else{

            element.value=data[key];

        }


    });



    updateRiskValue();


}





/* ============================
   RESET
============================ */


function resetSettings(){


    localStorage.removeItem(
        STORAGE_KEY
    );


    location.reload();


}





/* ============================
   RISK
============================ */


function updateRiskValue(){


    const slider =
    document.getElementById(
        "riskThreshold"
    );


    const value =
    document.getElementById(
        "riskThresholdValue"
    );



    if(slider && value){

        value.innerHTML =
        slider.value+"%";

    }


}





/* ============================
   STATUS
============================ */


function updateStatus(text){


    const status =
    document.getElementById(
        "settingsStatus"
    );


    if(status){

        status.innerHTML=text;

    }

}



function updateLastSaved(){


    const time =
    document.getElementById(
        "lastSavedTime"
    );


    if(time){

        time.innerHTML =
        new Date()
        .toLocaleTimeString();

    }


}





/* ============================
   TOAST
============================ */


function showToast(message,type="success"){


    const container =
    document.getElementById(
        "toastContainer"
    );


    if(!container){

        alert(message);

        return;

    }



    const toast =
    document.createElement(
        "div"
    );



    toast.className =
    "toast "+type;



    toast.innerHTML = message;



    container.appendChild(
        toast
    );



    setTimeout(()=>{

        toast.remove();

    },3000);


}





/* ============================
   EXPORT
============================ */


document
.getElementById("exportSettingsBtn")
?.addEventListener(
"click",
()=>{


    const data =
    localStorage.getItem(
        STORAGE_KEY
    ) || "{}";



    const blob =
    new Blob(
        [data],
        {
            type:"application/json"
        }
    );



    const url =
    URL.createObjectURL(
        blob
    );



    const link =
    document.createElement(
        "a"
    );


    link.href=url;

    link.download=
    "FinGuard_Settings.json";


    link.click();



    URL.revokeObjectURL(url);


});

