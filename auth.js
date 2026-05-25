// ============================================================
// FIREBASE AUTH — Google + Facebook Login
// Fixed: removed backtick syntax errors, added Firebase init,
//        added handleGoogleLogin, handleFacebookLogin functions,
//        added auth state listener, added spiritual-auth-success event
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
    } catch (error) {
        console.warn("Could not clear user profile cache:", error);
    }
}

// ── Helper: show/hide error message ─────────────────────────
function showLoginError(message) {
    const errorBox = document.getElementById("login-error");
    if (!errorBox) return;
    errorBox.textContent = message || "";
    // Auto-clear after 6 seconds
    setTimeout(() => { if (errorBox) errorBox.textContent = ""; }, 6000);
}

// ── Helper: friendly error messages in Gujarati ─────────────
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
    const googleBtn   = document.getElementById("google-login-btn");
    const facebookBtn = document.getElementById("facebook-login-btn");

    if (googleBtn) {
        googleBtn.disabled = isLoading;
        googleBtn.innerHTML = isLoading && providerName === "Google"
            ? "Please wait..."
            : '<span class="social-icon google-icon">G</span> CONTINUE WITH GOOGLE';
    }

    if (facebookBtn) {
        facebookBtn.disabled = isLoading;
        facebookBtn.innerHTML = isLoading && providerName === "Facebook"
            ? "Please wait..."
            : '<span class="social-icon facebook-icon">F</span> CONTINUE WITH FACEBOOK';
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

// ── Facebook Login ───────────────────────────────────────────
async function handleFacebookLogin() {
    showLoginError("");
    setAuthButtonsState(true, "Facebook");
    try {
        const provider = new firebase.auth.FacebookAuthProvider();
        await auth.signInWithPopup(provider);
        // Auth state listener handles UI update
    } catch (error) {
        console.error("Facebook login error:", error);
        showLoginError(getFriendlyAuthError(error, "Facebook"));
    } finally {
        setAuthButtonsState(false, "Facebook");
    }
}

// ── Auth State Listener ──────────────────────────────────────
auth.onAuthStateChanged((user) => {
    const loginScreen = document.getElementById("login-screen");
    const mainContent  = document.getElementById("main-content");
    const userProfile  = document.getElementById("user-profile");
    const userPhoto    = document.getElementById("user-photo");
    const userName     = document.getElementById("user-name");
    const userEmail    = document.getElementById("user-email");
    const logoutBtn    = document.getElementById("logout-btn");

    if (user) {
        // Show main website
        if (loginScreen) loginScreen.style.display = "none";
        if (mainContent)  mainContent.classList.remove("auth-hidden");

        // Show user profile bar
        if (userProfile) userProfile.style.display = "flex";
        if (userPhoto)   userPhoto.src = user.photoURL || "";
        if (userName)    userName.textContent = user.displayName || user.email || "User";
        if (userEmail)   userEmail.textContent = user.email || "";

        // Show logout button
        if (logoutBtn) logoutBtn.style.display = "inline-block";

        // Signal to script.js that auth succeeded — starts flute music
        window.dispatchEvent(new CustomEvent("spiritual-auth-success"));

    } else {
        // Show login screen
        if (loginScreen) loginScreen.style.display = "flex";
        if (mainContent)  mainContent.classList.add("auth-hidden");
        if (userProfile) userProfile.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "none";
        clearSafeUserProfile();
    }
});

// ── Logout ───────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    const googleBtn   = document.getElementById("google-login-btn");
    const facebookBtn = document.getElementById("facebook-login-btn");
    const logoutBtn   = document.getElementById("logout-btn");

    if (googleBtn)   googleBtn.addEventListener("click", handleGoogleLogin);
    if (facebookBtn) facebookBtn.addEventListener("click", handleFacebookLogin);

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                await auth.signOut();
            } catch (error) {
                console.error("Logout error:", error);
            }
        });
    }
});