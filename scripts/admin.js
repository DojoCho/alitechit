// ===============================
// SIMPLE ADMIN AUTH (client-side)
// ===============================

// Şifreyi buradan değiştir:
const ADMIN_PASSWORD = "alitech-2025-admin";

const loginForm = document.getElementById("loginForm");
const loginScreen = document.getElementById("loginScreen");
const dashboard = document.getElementById("dashboard");
const loginError = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");

// Auth check on load
const isAuthed = sessionStorage.getItem("alitech_admin_authed") === "1";

function showDashboard() {
    if (loginScreen) loginScreen.classList.add("hidden");
    if (dashboard) dashboard.classList.remove("hidden");
}

function showLogin() {
    if (loginScreen) loginScreen.classList.remove("hidden");
    if (dashboard) dashboard.classList.add("hidden");
}

if (isAuthed) {
    showDashboard();
} else {
    showLogin();
}

if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const pwdInput = document.getElementById("adminPassword");
        const value = pwdInput ? pwdInput.value : "";

        if (!value) return;

        if (value === ADMIN_PASSWORD) {
            sessionStorage.setItem("alitech_admin_authed", "1");
            showDashboard();
        } else {
            loginError.textContent = "Incorrect password.";
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem("alitech_admin_authed");
        showLogin();
    });
}

// ===============================
// SIDEBAR PANEL SWITCHING
// ===============================
const sidebarLinks = document.querySelectorAll(".sidebar-link[data-panel]");
const panels = document.querySelectorAll(".panel");

sidebarLinks.forEach(btn => {
    btn.addEventListener("click", () => {
        const target = btn.dataset.panel;
        if (!target) return;

        sidebarLinks.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        panels.forEach(p => {
            if (p.id === `panel-${target}`) {
                p.classList.add("active");
            } else {
                p.classList.remove("active");
            }
        });
    });
});

// ===============================
// PORTFOLIO JSON BUILDER
// ===============================
const pTitle = document.getElementById("pTitle");
const pCategory = document.getElementById("pCategory");
const pDate = document.getElementById("pDate");
const pLocation = document.getElementById("pLocation");
const pDescription = document.getElementById("pDescription");
const pEquipment = document.getElementById("pEquipment");
const pThumb = document.getElementById("pThumb");
const pFull = document.getElementById("pFull");
const jsonPreview = document.getElementById("jsonPreview");
const copyJsonBtn = document.getElementById("copyJsonBtn");

function updateJsonPreview() {
    if (!jsonPreview) return;

    const equipmentArray = (pEquipment?.value || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

    const obj = {
        title: pTitle?.value || "",
        category: pCategory?.value || "",
        date: pDate?.value || "",
        location: pLocation?.value || "",
        description: pDescription?.value || "",
        equipment: equipmentArray,
        thumb: pThumb?.value || "",
        full: pFull?.value || ""
    };

    jsonPreview.textContent = JSON.stringify(obj, null, 2);
}

[
    pTitle,
    pCategory,
    pDate,
    pLocation,
    pDescription,
    pEquipment,
    pThumb,
    pFull
].forEach(input => {
    if (!input) return;
    input.addEventListener("input", updateJsonPreview);
});

updateJsonPreview();

if (copyJsonBtn && jsonPreview) {
    copyJsonBtn.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(jsonPreview.textContent || "");
            copyJsonBtn.textContent = "Copied!";
            setTimeout(() => {
                copyJsonBtn.textContent = "Copy";
            }, 1500);
        } catch (err) {
            console.error("Clipboard error", err);
        }
    });
}

// ===============================
// ADMIN NOTES (localStorage)
// ===============================
const notesTextarea = document.getElementById("adminNotes");
const saveNotesBtn = document.getElementById("saveNotesBtn");
const notesStatus = document.getElementById("notesStatus");

const NOTES_KEY = "alitech_admin_notes";

if (notesTextarea) {
    const saved = localStorage.getItem(NOTES_KEY);
    if (saved) {
        notesTextarea.value = saved;
    }
}

if (saveNotesBtn && notesTextarea) {
    saveNotesBtn.addEventListener("click", () => {
        localStorage.setItem(NOTES_KEY, notesTextarea.value || "");
        if (notesStatus) {
            notesStatus.textContent = "Saved locally.";
            setTimeout(() => {
                notesStatus.textContent = "";
            }, 2000);
        }
    });
}
