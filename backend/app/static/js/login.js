/* ==========================================
   FinGuard AI Login Page
   login.js
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    // ===========================
    // Show / Hide Password
    // ===========================

    const password = document.getElementById("password");
    const toggle = document.getElementById("togglePassword");

    if (toggle && password) {

        toggle.addEventListener("click", () => {

            const icon = toggle.querySelector("i");

            if (password.type === "password") {

                password.type = "text";

                icon.classList.remove("fa-eye");
                icon.classList.add("fa-eye-slash");

            } else {

                password.type = "password";

                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");

            }

        });

    }


    // ===========================
    // Login Button Animation
    // ===========================

    const form = document.querySelector("form");
    const loginBtn = document.querySelector(".login-btn");

    if (form && loginBtn) {

        form.addEventListener("submit", function () {

            loginBtn.disabled = true;

            loginBtn.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                Signing In...
            `;

        });

    }


    // ===========================
    // Input Focus Effect
    // ===========================

    const inputs = document.querySelectorAll("input");

    inputs.forEach(input => {

        input.addEventListener("focus", () => {

            input.parentElement.style.transform = "scale(1.02)";

        });

        input.addEventListener("blur", () => {

            input.parentElement.style.transform = "scale(1)";

        });

    });


    // ===========================
    // Email Validation
    // ===========================

    const email = document.querySelector("input[type='email']");

    if (email) {

        email.addEventListener("blur", () => {

            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (email.value !== "" && !regex.test(email.value)) {

                email.style.borderColor = "#ef4444";

            } else {

                email.style.borderColor = "";

            }

        });

    }


    // ===========================
    // Card Animation
    // ===========================

    const card = document.querySelector(".login-card");

    if (card) {

        card.animate(

            [
                {
                    opacity:0,
                    transform:"translateY(40px)"
                },
                {
                    opacity:1,
                    transform:"translateY(0)"
                }
            ],

            {
                duration:700,
                easing:"ease-out"
            }

        );

    }


    // ===========================
    // Enter Key Support
    // ===========================

    document.addEventListener("keydown", (e)=>{

        if(e.key==="Enter"){

            if(form){

                form.requestSubmit();

            }

        }

    });

});