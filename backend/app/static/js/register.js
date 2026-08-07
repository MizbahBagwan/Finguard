/* ==========================================
   FinGuard AI Register Page
   register.js
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    // ===========================
    // Show / Hide Password
    // ===========================

    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");
    const toggle = document.getElementById("togglePassword");

    if (toggle && password) {

        toggle.addEventListener("click", () => {

            const icon = toggle.querySelector("i");

            if (password.type === "password") {

                password.type = "text";

                if (confirmPassword) {
                    confirmPassword.type = "text";
                }

                icon.classList.remove("fa-eye");
                icon.classList.add("fa-eye-slash");

            } else {

                password.type = "password";

                if (confirmPassword) {
                    confirmPassword.type = "password";
                }

                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");

            }

        });

    }
    const apply=document.getElementById("applyFilter");

if(apply){

apply.addEventListener("click",()=>{

showToast("Filters Applied");

});

}
const reset=document.getElementById("resetFilter");

if(reset){

reset.addEventListener("click",()=>{

document
.querySelectorAll(".filter-item input,.filter-item select")
.forEach(e=>e.value="");

document
.querySelectorAll(".transaction-row")
.forEach(r=>r.style.display="");

showToast("Filters Reset");

});

}

    // ===========================
    // Password Match Validation
    // ===========================

    const form = document.querySelector("form");

    if (form) {

        form.addEventListener("submit", function (e) {

            if (password.value !== confirmPassword.value) {

                e.preventDefault();

                alert("❌ Password and Confirm Password do not match.");

                confirmPassword.focus();

                return;
            }

            const btn = document.querySelector(".login-btn");

            btn.disabled = true;

            btn.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                Creating Account...
            `;

        });

    }

    // ===========================
    // Input Animation
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

    // ====================================
// SECOND SEARCH BAR
// ====================================

const search2=document.getElementById("searchInput2");

if(search2){

search2.addEventListener("keyup",function(){

const value=this.value.toLowerCase();

document.querySelectorAll(".transaction-row").forEach(row=>{

row.style.display=row.innerText
.toLowerCase()
.includes(value)
? ""
: "none";

});

});

}
});
