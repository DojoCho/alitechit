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
    els.userAvatar.innerHTML =
      `<img src="${url}" alt="avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
  } else {
    els.userAvatar.innerHTML = "";
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
    { displayName: safeName },
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
    if (els.userName) els.userName.textContent = "Guest";
    if (els.authStatus) els.authStatus.textContent = "Choose a sign-in method";
    setAvatar("", "?");
    if (els.logoutBtn) els.logoutBtn.style.display = "none";
    return;
  }

  const displayName = profile.displayName || "Player";
  const fallback = displayName.slice(0, 1).toUpperCase();

  if (els.userName) els.userName.textContent = displayName;
  if (els.authStatus) {
    els.authStatus.textContent = profile.isGuest ? "Guest session" : "Signed in";
  }

  setAvatar(profile.avatarUrl, fallback);

  if (els.logoutBtn) els.logoutBtn.style.display = "inline-flex";
}

async function handleGoogleLogin() {
  try {
    setStatus("Signing in with Google...");
    console.log("[Auth] Google login clicked");

    const result = await signInWithPopup(auth, googleProvider);
    const profile = await ensureUserProfile(result.user);

    window.currentDontBlinkUser = profile;
    renderUser(profile);
    setStatus("Signed in.");
    console.log("[Auth] Google login success");
  } catch (err) {
    console.error("[Auth] Google sign-in failed:", err);
    setStatus("Google sign-in failed.");
  }
}

async function handleGuestLogin() {
  try {
    setStatus("Continuing as guest...");
    console.log("[Auth] Guest login clicked");

    const result = await signInAnonymously(auth);
    const profile = await ensureUserProfile(result.user);

    window.currentDontBlinkUser = profile;
    renderUser(profile);
    setStatus("Guest session started.");
    console.log("[Auth] Guest login success");
  } catch (err) {
    console.error("[Auth] Guest sign-in failed:", err);
    setStatus("Guest sign-in failed.");
  }
}

async function handleLogout() {
  try {
    console.log("[Auth] Logout clicked");
    await signOut(auth);
    setStatus("Signed out.");
  } catch (err) {
    console.error("[Auth] Sign out failed:", err);
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

function bindAuthButtons() {
  if (els.googleBtn) {
    els.googleBtn.onclick = handleGoogleLogin;
  }

  if (els.guestBtn) {
    els.guestBtn.onclick = handleGuestLogin;
  }

  if (els.logoutBtn) {
    els.logoutBtn.onclick = handleLogout;
    els.logoutBtn.style.display = "none";
  }

  if (els.guestSave) {
    els.guestSave.onclick = async () => {
      const newName = els.guestInput?.value || "";
      await updateGuestName(newName);
      closeGuestNameModal();
    };
  }

  if (els.guestModal) {
    els.guestModal.addEventListener("click", (e) => {
      if (e.target === els.guestModal) {
        closeGuestNameModal();
      }
    });
  }
}

bindAuthButtons();
window.addEventListener("DOMContentLoaded", bindAuthButtons);

onAuthStateChanged(auth, async (user) => {
  try {
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
  } catch (err) {
    console.error("[Auth] onAuthStateChanged error:", err);
  }
});

window.DontBlinkAuthUI = {
  openGuestNameModal,
  handleGoogleLogin,
  handleGuestLogin,
  handleLogout
};