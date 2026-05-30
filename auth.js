// ============================================================
// FIREBASE AUTH — Google Login
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyBeJo_62m2cZiMdUAVhJaMEstd_ZOS7bbI",
    authDomain: "jay-shree-ram-web.firebaseapp.com",
    projectId: "jay-shree-ram-web",
    appId: "1:469351755047:web:59da13f1d778613b104d02"
};

// Prevent duplicate Firebase init
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

// Persistent login across sessions
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// ── Helper: clear cached user profile ───────────────────────
function clearSafeUserProfile() {
    try {
        localStorage.removeItem("spiritualUserProfile");
        localStorage.removeItem("profilePhoto");
    } catch (error) {
        console.warn("Could not clear user profile cache:", error);
    }
}

// ── Helper: show login error ─────────────────────────────────
function showLoginError(message) {
    const errorBox = document.getElementById("login-error");
    if (!errorBox) return;
    errorBox.textContent = message || "";
    if (message) {
        setTimeout(() => { if (errorBox) errorBox.textContent = ""; }, 6000);
    }
}

// ── Helper: friendly error messages (Gujarati) ───────────────
function getFriendlyAuthError(error, providerName) {
    if (!error || !error.code) return `${providerName} login failed. ફરી try કર.`;
    switch (error.code) {
        case "auth/popup-closed-by-user":
            return "તમે login popup બંધ કરી દીધું.";
        case "auth/popup-blocked":
            return "Browser એ popup block કર્યું છે. Popup allow કર.";
        case "auth/unauthorized-domain":
            return "આ domain Firebase Authorized Domains માં નથી.";
        case "auth/network-request-failed":
            return "Network problem છે. Internet check કર.";
        case "auth/cancelled-popup-request":
            return "Login popup પહેલેથી open છે. એક જ વાર click કર.";
        case "auth/account-exists-with-different-credential":
            return "આ email બીજી login method સાથે જોડાયેલ છે.";
        default:
            return `${providerName} login failed. Firebase setup check કર.`;
    }
}

// ── Helper: set loading state on buttons ────────────────────
function setAuthButtonsState(isLoading, providerName) {
    const googleBtn = document.getElementById("google-login-btn");

    if (googleBtn) {
        googleBtn.disabled = isLoading;
        googleBtn.innerHTML = isLoading && providerName === "Google"
            ? "Please wait..."
            : '<span class="social-icon google-icon">G</span> CONTINUE WITH GOOGLE';
    }
}

// ── Google Login ─────────────────────────────────────────────
async function handleGoogleLogin() {
    showLoginError("");
    setAuthButtonsState(true, "Google");
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
        // Auth state listener handles UI update
    } catch (error) {
        console.error("Google login error:", error);
        showLoginError(getFriendlyAuthError(error, "Google"));
    } finally {
        setAuthButtonsState(false, "Google");
    }
}

// ── Unified: update ALL user-facing UI from a Firebase user ──
// Called on login and on page load (from auth state listener).
// Also called after profile photo upload to refresh avatars.
function updateAllUserUI(user) {
    if (!user) return;

    const email       = user.email || "";
    const displayName = user.displayName || "";
    const source      = displayName || email || "User";
    const initial     = source.charAt(0).toUpperCase();

    // Build a clean display name: strip ".com" artifact from email-as-name
    let cleanName = displayName || email || "User";
    cleanName = cleanName.replace(/\.com$/i, "");

    // Saved profile photo (uploaded by user, persisted in localStorage)
    const savedPhoto = localStorage.getItem("profilePhoto");

    // ── Top bar user profile ──────────────────────────────────
    const userPhoto  = document.getElementById("user-photo");
    const userName   = document.getElementById("user-name");
    const userEmail  = document.getElementById("user-email");

    if (userPhoto)  userPhoto.src = savedPhoto || user.photoURL || "";
    if (userName)   userName.textContent = cleanName;
    if (userEmail)  userEmail.textContent = email;

    // ── Sidebar user section ──────────────────────────────────
    const sidebarInitial = document.getElementById("sidebar-user-initial");
    const sidebarName    = document.getElementById("sidebar-user-name");
    const sidebarEmail   = document.getElementById("sidebar-user-email");

    if (sidebarInitial) {
        if (savedPhoto) {
            sidebarInitial.innerHTML = `<img src="${savedPhoto}" alt="User photo"
                style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        } else {
            sidebarInitial.textContent = initial;
        }
    }
    if (sidebarName)  sidebarName.textContent  = cleanName;
    if (sidebarEmail) sidebarEmail.textContent  = email || "No email found";

    // ── Profile modal ─────────────────────────────────────────
    const profileAvatar  = document.getElementById("profile-avatar");
    const modalEmailEl   = document.getElementById("profile-modal-email");
    const modalNameEl    = document.getElementById("profile-modal-name");

    if (profileAvatar) {
        if (savedPhoto) {
            profileAvatar.innerHTML = `<img src="${savedPhoto}" alt="Profile photo"
                style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        } else {
            profileAvatar.textContent = initial;
        }
    }
    if (modalEmailEl) modalEmailEl.textContent = email || "No email found";
    if (modalNameEl)  modalNameEl.textContent  = cleanName;
}

// ── Profile photo upload (called from your profile modal HTML) ─
// Example: <input type="file" id="profile-photo-input" accept="image/*">
function initProfilePhotoUpload() {
    const input = document.getElementById("profile-photo-input");
    if (!input) return;

    input.addEventListener("change", () => {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            try {
                localStorage.setItem("profilePhoto", dataUrl);
            } catch (err) {
                console.warn("Could not save profile photo:", err);
            }
            // Refresh all avatars immediately
            const user = auth.currentUser;
            if (user) updateAllUserUI(user);
        };
        reader.readAsDataURL(file);
    });
}

// ── Single Auth State Listener ───────────────────────────────
auth.onAuthStateChanged((user) => {
    const loginScreen = document.getElementById("login-screen");
    const mainContent = document.getElementById("main-content");
    const userProfile = document.getElementById("user-profile");

    if (user) {
        // Show main website
        if (loginScreen) loginScreen.style.display = "none";
        if (mainContent)  mainContent.classList.remove("auth-hidden");
        if (userProfile)  userProfile.style.display = "flex";

        // Update all UI elements with user data
        updateAllUserUI(user);

        // Signal to script.js that auth succeeded (starts flute music, etc.)
        window.dispatchEvent(new CustomEvent("spiritual-auth-success"));

    } else {
        // Show login screen, hide content
        if (loginScreen) loginScreen.style.display = "flex";
        if (mainContent)  mainContent.classList.add("auth-hidden");
        if (userProfile)  userProfile.style.display = "none";

        clearSafeUserProfile();
    }
});

// ── Wire up buttons on DOM ready ─────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    const googleBtn = document.getElementById("google-login-btn");
    const logoutBtn = document.getElementById("logout-btn");

    if (googleBtn) googleBtn.addEventListener("click", handleGoogleLogin);

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                clearSafeUserProfile();   // Clear photo + profile cache first
                await auth.signOut();     // Firebase sign-out triggers listener above
            } catch (error) {
                console.error("Logout error:", error);
            }
        });
    }

    // Set up profile photo upload if the input exists in this page
    initProfilePhotoUpload();
});