import {
    auth,
    db,
    googleProvider,
    makeGuestName
} from "./firebase-init.js";

import {
    signInWithPopup,
    signInAnonymously,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const els = {
    googleBtn: document.getElementById("btn-google-login"),
    guestBtn: document.getElementById("btn-guest-login"),
    logoutBtn: document.getElementById("btn-logout"),
    userName: document.getElementById("auth-user-name"),
    userAvatar: document.getElementById("auth-user-avatar"),
    authStatus: document.getElementById("auth-status"),
    guestModal: document.getElementById("guest-name-modal"),
    guestInput: document.getElementById("guest-name-input"),
    guestSave: document.getElementById("guest-name-save")
};

function setStatus(text) {
    if (els.authStatus) els.authStatus.textContent = text;
}

function setAvatar(url, fallbackText = "?") {
    if (!els.userAvatar) return;

    if (url) {
        els.userAvatar.innerHTML = `<img src="${url}" alt="avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    } else {
        els.userAvatar.textContent = fallbackText;
    }
}

function normalizeName(name) {
    const cleaned = (name || "").trim().replace(/\s+/g, " ");
    return cleaned.slice(0, 24);
}

async function ensureUserProfile(user) {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
        const data = snap.data();
        return {
            uid: user.uid,
            displayName: data.displayName || user.displayName || makeGuestName(),
            avatarUrl: data.avatarUrl || user.photoURL || "",
            provider: data.provider || (user.isAnonymous ? "anonymous" : "google"),
            isGuest: !!data.isGuest
        };
    }

    const initialName =
        user.displayName ||
        (user.isAnonymous ? makeGuestName() : "Player");

    const profile = {
        uid: user.uid,
        displayName: initialName,
        avatarUrl: user.photoURL || "",
        provider: user.isAnonymous ? "anonymous" : "google",
        isGuest: !!user.isAnonymous,
        bestScore: 0,
        createdAt: serverTimestamp()
    };

    await setDoc(userRef, profile);
    return profile;
}

async function updateGuestName(newName) {
    const user = auth.currentUser;
    if (!user) return;

    const safeName = normalizeName(newName);
    if (!safeName) return;

    const userRef = doc(db, "users", user.uid);
    await setDoc(
        userRef,
        {
            displayName: safeName
        },
        { merge: true }
    );

    window.currentDontBlinkUser = {
        ...(window.currentDontBlinkUser || {}),
        displayName: safeName
    };

    renderUser(window.currentDontBlinkUser);
}

function renderUser(profile) {
    if (!profile) {
        if (els.userName) els.userName.textContent = "Not signed in";
        if (els.authStatus) els.authStatus.textContent = "Choose a sign-in method";
        setAvatar("", "?");
        if (els.logoutBtn) els.logoutBtn.style.display = "none";
        return;
    }

    if (els.userName) {
        els.userName.textContent = profile.displayName || "Player";
    }
    if (els.authStatus) {
        els.authStatus.textContent = profile.isGuest ? "Guest session" : "Signed in";
    }

    if (els.logoutBtn) els.logoutBtn.style.display = "inline-flex";
}

async function handleGoogleLogin() {
    try {
        setStatus("Signing in with Google...");
        const result = await signInWithPopup(auth, googleProvider);
        await ensureUserProfile(result.user);
        setStatus("Signed in.");
    } catch (err) {
        console.error(err);
        setStatus("Google sign-in failed.");
    }
}

async function handleGuestLogin() {
    try {
        setStatus("Continuing as guest...");
        const result = await signInAnonymously(auth);
        const profile = await ensureUserProfile(result.user);
        window.currentDontBlinkUser = profile;
        renderUser(profile);
        setStatus("Guest session started.");
    } catch (err) {
        console.error(err);
        setStatus("Guest sign-in failed.");
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
        setStatus("Signed out.");
    } catch (err) {
        console.error(err);
        setStatus("Sign out failed.");
    }
}

function openGuestNameModal(currentName = "") {
    if (!els.guestModal) return;
    els.guestModal.style.display = "flex";
    if (els.guestInput) {
        els.guestInput.value = currentName;
        els.guestInput.focus();
    }
}

function closeGuestNameModal() {
    if (!els.guestModal) return;
    els.guestModal.style.display = "none";
}

if (els.googleBtn) {
    els.googleBtn.addEventListener("click", handleGoogleLogin);
}

if (els.guestBtn) {
    els.guestBtn.addEventListener("click", handleGuestLogin);
}

if (els.logoutBtn) {
    els.logoutBtn.addEventListener("click", handleLogout);
    els.logoutBtn.style.display = "none";
}

if (els.guestSave) {
    els.guestSave.addEventListener("click", async () => {
        const newName = els.guestInput?.value || "";
        await updateGuestName(newName);
        closeGuestNameModal();
    });
}

if (els.guestModal) {
    els.guestModal.addEventListener("click", (e) => {
        if (e.target === els.guestModal) {
            closeGuestNameModal();
        }
    });
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.currentDontBlinkUser = null;
        renderUser(null);
        return;
    }

    const profile = await ensureUserProfile(user);
    window.currentDontBlinkUser = profile;
    renderUser(profile);

    if (window.DontBlinkLeaderboard?.refreshTop10) {
        await window.DontBlinkLeaderboard.refreshTop10();
    }
});

window.DontBlinkAuthUI = {
    openGuestNameModal
};