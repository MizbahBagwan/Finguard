// Show / Hide Password
const password = document.getElementById("password");
const toggle = document.getElementById("togglePassword");

toggle.addEventListener("click", () => {
    if (password.type === "password") {
        password.type = "text";
        toggle.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    } else {
        password.type = "password";
        toggle.innerHTML = '<i class="fa-solid fa-eye"></i>';
    }
});

// Login Form
const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btn = form.querySelector("button");

    btn.disabled = true;
    btn.innerHTML = "Logging in...";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {

        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (response.ok) {

            // Save JWT Token
            localStorage.setItem("token", data.access_token);

            alert("✅ Login Successful");

            window.location.href = "/dashboard";

        } else {

            alert(data.detail || "Invalid Email or Password");

        }

    } catch (error) {

        console.error(error);
        alert("Server Error");

    }

    btn.disabled = false;
    btn.innerHTML = "Login";

});