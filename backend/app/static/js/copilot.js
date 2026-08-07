/* =====================================
   FinGuard AI Copilot - Part 1
===================================== */

document.addEventListener("DOMContentLoaded", function () {

    const input = document.getElementById("userInput");
    const chatBox = document.getElementById("chatMessages");
    const typing = document.getElementById("typingIndicator");
    const sendBtn = document.getElementById("sendBtn");

    function scrollBottom() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function addMessage(text, type = "user") {

        const msg = document.createElement("div");
        msg.className = "message " + type;

        if (type === "user") {

            msg.innerHTML = `
                <div class="message-avatar">
                    <i class="fa-solid fa-user"></i>
                </div>

                <div class="message-content">
                    <p>${text}</p>
                </div>
            `;

        } else {

            msg.innerHTML = `
                <div class="message-avatar">
                    <i class="fa-solid fa-robot"></i>
                </div>

                <div class="message-content">
                    <h4>FinGuard AI</h4>
                    <p>${text}</p>
                </div>
            `;

        }

        chatBox.appendChild(msg);
        scrollBottom();
    }

    async function sendMessage(customMessage = null) {

        let message = customMessage || input.value.trim();

        if (!message)
            return;

        addMessage(message, "user");

        input.value = "";

        typing.style.display = "flex";

        try {

            const response = await fetch("/api/copilot/chat", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: message
                })

            });

            typing.style.display = "none";

            if (!response.ok) {
                throw new Error("Server Error");
            }

            const data = await response.json();

            addMessage(data.response, "ai");

        }
        catch (err) {

            typing.style.display = "none";

            addMessage(
                "❌ Unable to connect with FinGuard AI.",
                "ai"
            );

            console.error(err);

        }

    }

    /* Send Button */

    if (sendBtn) {

        sendBtn.addEventListener(
            "click",
            function () {
                sendMessage();
            }
        );

    }

    /* Enter Key */

    input.addEventListener(
        "keydown",
        function (e) {

            if (e.key === "Enter") {

                e.preventDefault();

                sendMessage();

            }

        }
    );

    /* HTML onclick Support */

    window.sendMessage = sendMessage;
/* =====================================
   Quick Action Buttons
===================================== */

window.analyzeTransaction = function () {
    sendMessage("Analyze the selected transaction and explain the fraud risk.");
};

window.explainFraud = function () {
    sendMessage("Explain why this transaction is marked as fraud.");
};

window.openOCR = function () {
    sendMessage("Extract important information using OCR.");
};

window.openSHAP = function () {
    sendMessage("Explain this prediction using SHAP.");
};

window.openGraph = function () {
    sendMessage("Show the fraud knowledge graph and relationships.");
};

window.generateReport = function () {
    sendMessage("Generate a complete fraud investigation report.");
};


/* =====================================
   Suggestion Buttons
===================================== */

document.querySelectorAll(".suggestion-box button").forEach(btn => {

    btn.addEventListener("click", function () {

        sendMessage(this.innerText);

    });

});


/* =====================================
   Focus Input on Load
===================================== */

if (input) {
    input.focus();
}


/* =====================================
   Hide Typing Indicator Initially
===================================== */

if (typing) {
    typing.style.display = "none";
}


/* =====================================
   End of File
===================================== */

});