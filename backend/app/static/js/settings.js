```javascript
alert("SETTINGS JS RUNNING");

document.addEventListener("DOMContentLoaded", () => {

    console.log("FinGuard Settings JS Loaded");

    initializeSettings();
    registerEvents();
    loadSettings();

});


/* =========================================================
   INITIALIZE
========================================================= */

function initializeSettings() {

    updateRiskValue();

}


/* =========================================================
   EVENTS
========================================================= */

function registerEvents() {

    // -----------------------------------------
    // Save buttons
    // -----------------------------------------

    document
        .querySelectorAll("#saveAllSettingsBtn, #saveAllSettingsBottomBtn")
        .forEach(button => {

            button.addEventListener(
                "click",
                saveSettings
            );

        });


    // -----------------------------------------
    // Reset
    // -----------------------------------------

    document
        .getElementById("resetSettingsBtn")
        ?.addEventListener(
            "click",
            resetSettings
        );


    document
        .getElementById("resetAllSettingsBtn")
        ?.addEventListener(
            "click",
            resetAllSettings
        );


    // -----------------------------------------
    // Profile
    // -----------------------------------------

    document
        .getElementById("editProfileBtn")
        ?.addEventListener(
            "click",
            openProfile
        );


    document
        .getElementById("updateProfileBtn")
        ?.addEventListener(
            "click",
            updateProfile
        );


    document
        .getElementById("closeProfileModal")
        ?.addEventListener(
            "click",
            closeProfileModal
        );


    // -----------------------------------------
    // Password
    // -----------------------------------------

    document
        .getElementById("changePasswordBtn")
        ?.addEventListener(
            "click",
            openPassword
        );


    document
        .getElementById("updatePasswordBtn")
        ?.addEventListener(
            "click",
            updatePassword
        );


    document
        .getElementById("closePasswordModal")
        ?.addEventListener(
            "click",
            closePasswordModal
        );


    // -----------------------------------------
    // Devices
    // -----------------------------------------

    document
        .getElementById("manageDevicesBtn")
        ?.addEventListener(
            "click",
            loadDevices
        );


    document
        .getElementById("closeDevicesModal")
        ?.addEventListener(
            "click",
            closeDevicesModal
        );


    // -----------------------------------------
    // Logout all
    // -----------------------------------------

    document
        .getElementById("logoutAllBtn")
        ?.addEventListener(
            "click",
            logoutAllDevices
        );


    // -----------------------------------------
    // Risk slider
    // -----------------------------------------

    document
        .getElementById("riskThreshold")
        ?.addEventListener(
            "input",
            updateRiskValue
        );


    // -----------------------------------------
    // 2FA
    // -----------------------------------------

    document
        .getElementById("twoFactor")
        ?.addEventListener(
            "change",
            updateTwoFactor
        );


    // -----------------------------------------
    // Export
    // -----------------------------------------

    document
        .getElementById("exportSettingsBtn")
        ?.addEventListener(
            "click",
            exportSettings
        );


    // -----------------------------------------
    // Backup
    // -----------------------------------------

    document
        .getElementById("backupSettingsBtn")
        ?.addEventListener(
            "click",
            backupSettings
        );


    // -----------------------------------------
    // Restore
    // -----------------------------------------

    document
        .getElementById("restoreSettingsBtn")
        ?.addEventListener(
            "click",
            restoreSettings
        );


    // -----------------------------------------
    // Clear cache
    // -----------------------------------------

    document
        .getElementById("clearCacheBtn")
        ?.addEventListener(
            "click",
            clearCache
        );


    // -----------------------------------------
    // Delete account
    // -----------------------------------------

    document
        .getElementById("deleteAccountBtn")
        ?.addEventListener(
            "click",
            deleteAccount
        );

}


/* =========================================================
   LOAD SETTINGS FROM DATABASE
========================================================= */

async function loadSettings() {

    try {

        const response = await fetch(
            "/api/settings",
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            }
        );


        if (response.status === 401) {

            window.location.href = "/login";
            return;

        }


        if (!response.ok) {

            throw new Error(
                "Unable to load settings"
            );

        }


        const result = await response.json();


        if (
            !result.success ||
            !result.settings
        ) {

            throw new Error(
                "Invalid settings response"
            );

        }


        applySettings(
            result.settings
        );


        updateStatus("Saved");


        if (result.last_saved) {

            updateLastSaved(
                result.last_saved
            );

        }


        console.log(
            "Settings loaded from database:",
            result.settings
        );


    }
    catch (error) {

        console.error(
            "Settings load error:",
            error
        );


        showToast(
            "Settings load failed",
            "error"
        );

    }

}


/* =========================================================
   APPLY SETTINGS
========================================================= */

function applySettings(data) {

    Object.keys(data)
        .forEach(key => {

            const element =
                document.getElementById(key);


            if (!element) {
                return;
            }


            if (
                element.type === "checkbox"
            ) {

                element.checked =
                    Boolean(data[key]);

            }
            else {

                element.value =
                    data[key];

            }

        });


    updateRiskValue();

}


/* =========================================================
   COLLECT SETTINGS
========================================================= */

function collectSettings() {

    const data = {};


    Object.keys({
        twoFactor: true,
        loginAlerts: true,
        sessionTimeout: true,

        aiProtectionLevel: true,
        autoFraudScan: true,
        realTimeMonitoring: true,
        aiLearning: true,
        autoModelUpdate: true,
        riskThreshold: true,
        smartDetection: true,

        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        highRiskAlerts: true,

        appTheme: true,
        appLanguage: true,
        timeZone: true,
        dateFormat: true,

        activityLogs: true,
        usageAnalytics: true,
        dataSharing: true
    })
    .forEach(key => {

        const element =
            document.getElementById(key);


        if (!element) {
            return;
        }


        if (
            element.type === "checkbox"
        ) {

            data[key] =
                element.checked;

        }
        else {

            data[key] =
                element.value;

        }

    });


    data.riskThreshold =
        Number(
            data.riskThreshold
        );


    return data;

}


/* =========================================================
   SAVE SETTINGS
========================================================= */

async function saveSettings() {

    const data =
        collectSettings();


    updateStatus(
        "Saving..."
    );


    try {

        const response = await fetch(
            "/api/settings/save",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",
                    "Accept":
                        "application/json"
                },

                body:
                    JSON.stringify(data)
            }
        );


        if (response.status === 401) {

            window.location.href =
                "/login";

            return;

        }


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.detail ||
                result.error ||
                "Settings save failed"
            );

        }


        updateStatus(
            "Saved"
        );


        updateLastSaved();


        showToast(
            result.message ||
            "Settings saved successfully",
            "success"
        );


        console.log(
            "Settings saved:",
            result.settings
        );


    }
    catch (error) {

        console.error(
            "Save settings error:",
            error
        );


        updateStatus(
            "Save Failed"
        );


        showToast(
            error.message ||
            "Settings save failed",
            "error"
        );

    }

}


/* =========================================================
   RESET SETTINGS
========================================================= */

async function resetSettings() {

    const confirmed =
        confirm(
            "Reset all settings to default values?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                "/api/settings/reset",
                {
                    method: "POST",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.detail ||
                "Reset failed"
            );

        }


        applySettings(
            result.settings
        );


        updateStatus(
            "Saved"
        );


        updateLastSaved();


        showToast(
            result.message ||
            "Settings reset successfully",
            "success"
        );


    }
    catch (error) {

        console.error(error);


        showToast(
            error.message ||
            "Settings reset failed",
            "error"
        );

    }

}


/* =========================================================
   DANGER RESET
========================================================= */

async function resetAllSettings() {

    await resetSettings();

}


/* =========================================================
   PROFILE
========================================================= */

async function openProfile() {

    try {

        const response =
            await fetch(
                "/api/profile"
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.detail ||
                "Unable to load profile"
            );

        }


        const profile =
            result.profile;


        const name =
            document.getElementById(
                "editName"
            );


        const email =
            document.getElementById(
                "editEmail"
            );


        const role =
            document.getElementById(
                "editRole"
            );


        if (name) {

            name.value =
                profile.username || "";

        }


        if (email) {

            email.value =
                profile.email || "";

        }


        if (role) {

            role.value =
                "Administrator";

        }


        const modal =
            document.getElementById(
                "profileModal"
            );


        if (modal) {

            modal.style.display =
                "flex";

        }
        else {

            window.location.href =
                "/profile/edit";

        }

    }
    catch (error) {

        console.error(error);

        showToast(
            "Unable to load profile",
            "error"
        );

    }

}


/* =========================================================
   UPDATE PROFILE
========================================================= */

async function updateProfile() {

    const name =
        document.getElementById(
            "editName"
        )?.value.trim();


    const email =
        document.getElementById(
            "editEmail"
        )?.value.trim();


    if (!name || !email) {

        showToast(
            "Name and email are required",
            "error"
        );

        return;

    }


    try {

        const response =
            await fetch(
                "/api/profile",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        name: name,
                        email: email
                    })
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.detail ||
                "Profile update failed"
            );

        }


        showToast(
            result.message ||
            "Profile updated successfully",
            "success"
        );


        setTimeout(
            () => location.reload(),
            800
        );

    }
    catch (error) {

        console.error(error);


        showToast(
            error.message ||
            "Profile update failed",
            "error"
        );

    }

}


/* =========================================================
   CLOSE PROFILE
========================================================= */

function closeProfileModal() {

    const modal =
        document.getElementById(
            "profileModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }

}


/* =========================================================
   PASSWORD
========================================================= */

function openPassword() {

    const modal =
        document.getElementById(
            "passwordModal"
        );


    if (modal) {

        modal.style.display =
            "flex";

    }
    else {

        window.location.href =
            "/change-password";

    }

}


/* =========================================================
   UPDATE PASSWORD
========================================================= */

async function updatePassword() {

    const currentPassword =
        document.getElementById(
            "currentPassword"
        )?.value;


    const newPassword =
        document.getElementById(
            "newPassword"
        )?.value;


    const confirmPassword =
        document.getElementById(
            "confirmPassword"
        )?.value;


    if (
        !currentPassword ||
        !newPassword ||
        !confirmPassword
    ) {

        showToast(
            "Please fill all password fields",
            "error"
        );

        return;

    }


    if (
        newPassword !==
        confirmPassword
    ) {

        showToast(
            "Passwords do not match",
            "error"
        );

        return;

    }


    try {

        const response =
            await fetch(
                "/api/change-password",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        currentPassword:
                            currentPassword,

                        newPassword:
                            newPassword,

                        confirmPassword:
                            confirmPassword
                    })
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.detail ||
                "Password update failed"
            );

        }


        showToast(
            result.message ||
            "Password updated successfully",
            "success"
        );


        document.getElementById(
            "currentPassword"
        ).value = "";


        document.getElementById(
            "newPassword"
        ).value = "";


        document.getElementById(
            "confirmPassword"
        ).value = "";


        closePasswordModal();

    }
    catch (error) {

        console.error(error);


        showToast(
            error.message ||
            "Password update failed",
            "error"
        );

    }

}


/* =========================================================
   CLOSE PASSWORD
========================================================= */

function closePasswordModal() {

    const modal =
        document.getElementById(
            "passwordModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }

}


/* =========================================================
   DEVICES
========================================================= */

async function loadDevices() {

    try {

        const response =
            await fetch(
                "/api/devices"
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.detail ||
                "Unable to load devices"
            );

        }


        const container =
            document.getElementById(
                "devicesList"
            );


        if (!container) {
            return;
        }


        container.innerHTML = "";


        if (
            !result.devices ||
            result.devices.length === 0
        ) {

            container.innerHTML =
                "<p>No active devices found.</p>";

        }
        else {

            result.devices.forEach(
                device => {

                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "device-item";


                    item.innerHTML = `
                        <strong>
                            ${escapeHtml(device.device)}
                        </strong>

                        <p>
                            Status:
                            ${escapeHtml(device.status)}
                        </p>

                        ${
                            device.current
                            ? "<small>Current Device</small>"
                            : ""
                        }
                    `;


                    container.appendChild(
                        item
                    );

                }
            );

        }


        const modal =
            document.getElementById(
                "devicesModal"
            );


        if (modal) {

            modal.style.display =
                "flex";

        }

    }
    catch (error) {

        console.error(error);


        showToast(
            "Unable to load devices",
            "error"
        );

    }

}


/* =========================================================
   CLOSE DEVICES
========================================================= */

function closeDevicesModal() {

    const modal =
        document.getElementById(
            "devicesModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }

}


/* =========================================================
   LOGOUT ALL DEVICES
========================================================= */

async function logoutAllDevices() {

    const confirmed =
        confirm(
            "Logout all other active devices?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                "/api/logout-all",
                {
                    method: "POST"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.detail ||
                "Logout failed"
            );

        }


        showToast(
            result.message ||
            "Other devices logged out",
            "success"
        );

    }
    catch (error) {

        console.error(error);


        showToast(
            error.message ||
            "Unable to logout devices",
            "error"
        );

    }

}


/* =========================================================
   TWO FACTOR
========================================================= */

async function updateTwoFactor(event) {

    const enabled =
        event.target.checked;


    try {

        const response =
            await fetch(
                "/api/2fa",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        enabled: enabled
                    })
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.detail ||
                "2FA update failed"
            );

        }


        showToast(
            result.message,
            "success"
        );

    }
    catch (error) {

        console.error(error);


        // Restore old state
        event.target.checked =
            !enabled;


        showToast(
            error.message ||
            "2FA update failed",
            "error"
        );

    }

}


/* =========================================================
   EXPORT SETTINGS
========================================================= */

async function exportSettings() {

    try {

        const response =
            await fetch(
                "/api/settings/export"
            );


        if (!response.ok) {

            throw new Error(
                "Export failed"
            );

        }


        const blob =
            await response.blob();


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            "FinGuard_Settings.json";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        showToast(
            "Settings exported successfully",
            "success"
        );

    }
    catch (error) {

        console.error(error);


        showToast(
            "Settings export failed",
            "error"
        );

    }

}


/* =========================================================
   BACKUP
========================================================= */

async function backupSettings() {

    try {

        const response =
            await fetch(
                "/api/settings/backup"
            );


        if (!response.ok) {

            throw new Error(
                "Backup failed"
            );

        }


        const blob =
            await response.blob();


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            "FinGuard_Settings_Backup.json";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        showToast(
            "Backup created successfully",
            "success"
        );

    }
    catch (error) {

        console.error(error);


        showToast(
            "Backup failed",
            "error"
        );

    }

}


/* =========================================================
   RESTORE
========================================================= */

async function restoreSettings() {

    const input =
        document.createElement(
            "input"
        );


    input.type =
        "file";


    input.accept =
        ".json,application/json";


    input.onchange =
        async function () {

            const file =
                input.files[0];


            if (!file) {
                return;
            }


            const formData =
                new FormData();


            formData.append(
                "file",
                file
            );


            try {

                const response =
                    await fetch(
                        "/api/settings/restore",
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                const result =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        result.detail ||
                        "Restore failed"
                    );

                }


                applySettings(
                    result.settings
                );


                updateRiskValue();


                showToast(
                    result.message ||
                    "Settings restored successfully",
                    "success"
                );

            }
            catch (error) {

                console.error(error);


                showToast(
                    error.message ||
                    "Restore failed",
                    "error"
                );

            }

        };


    input.click();

}


/* =========================================================
   CLEAR CACHE
========================================================= */

async function clearCache() {

    const confirmed =
        confirm(
            "Clear application cache?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                "/api/cache/clear",
                {
                    method: "POST"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.detail ||
                "Cache clear failed"
            );

        }


        showToast(
            result.message ||
            "Cache cleared successfully",
            "success"
        );

    }
    catch (error) {

        console.error(error);


        showToast(
            error.message ||
            "Cache clear failed",
            "error"
        );

    }

}


/* =========================================================
   DELETE ACCOUNT
========================================================= */

async function deleteAccount() {

    const firstConfirm =
        confirm(
            "WARNING: This will permanently delete your account. Continue?"
        );


    if (!firstConfirm) {
        return;
    }


    const secondConfirm =
        prompt(
            "Type DELETE to permanently delete your account:"
        );


    if (secondConfirm !== "DELETE") {

        showToast(
            "Account deletion cancelled",
            "error"
        );

        return;

    }


    try {

        const response =
            await fetch(
                "/api/account/delete",
                {
                    method: "DELETE",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({})
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.detail ||
                "Account deletion failed"
            );

        }


        showToast(
            result.message ||
            "Account deleted",
            "success"
        );


        setTimeout(
            () => {

                window.location.href =
                    "/login";

            },
            1000
        );

    }
    catch (error) {

        console.error(error);


        showToast(
            error.message ||
            "Account deletion failed",
            "error"
        );

    }

}


/* =========================================================
   RISK VALUE
========================================================= */

function updateRiskValue() {

    const slider =
        document.getElementById(
            "riskThreshold"
        );


    const value =
        document.getElementById(
            "riskThresholdValue"
        );


    if (
        slider &&
        value
    ) {

        value.innerHTML =
            slider.value + "%";

    }

}


/* =========================================================
   STATUS
========================================================= */

function updateStatus(text) {

    const status =
        document.getElementById(
            "settingsStatus"
        );


    if (status) {

        status.innerHTML =
            text;

    }

}


/* =========================================================
   LAST SAVED
========================================================= */

function updateLastSaved(
    savedTime = null
) {

    const time =
        document.getElementById(
            "lastSavedTime"
        );


    if (!time) {
        return;
    }


    if (savedTime) {

        const date =
            new Date(
                savedTime
            );


        if (!isNaN(date.getTime())) {

            time.innerHTML =
                date.toLocaleString();

            return;

        }

    }


    time.innerHTML =
        new Date()
            .toLocaleTimeString();

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    const container =
        document.getElementById(
            "toastContainer"
        );


    if (!container) {

        alert(message);

        return;

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        "toast " + type;


    toast.textContent =
        message;


    container.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.remove();

        },
        3000
    );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}
```
