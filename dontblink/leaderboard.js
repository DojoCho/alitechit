import { auth, db } from "./firebase-init.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const els = {
  top10List: document.getElementById("top10-list"),
  myBest: document.getElementById("my-best-score"),
  saveModal: document.getElementById("save-score-modal"),
  saveScoreNum: document.getElementById("save-score-num")
};

// Score the player earned while signed out, kept until they sign in / guest
let pendingScore = 0;

function showSaveModal(score) {
  pendingScore = Math.max(pendingScore, score);
  if (els.saveScoreNum) els.saveScoreNum.textContent = pendingScore;
  if (els.saveModal) els.saveModal.classList.remove("hidden");
}

function hideSaveModal() {
  if (els.saveModal) els.saveModal.classList.add("hidden");
}

function renderTop10(rows) {
  if (!els.top10List) return;

  if (!rows.length) {
    els.top10List.innerHTML = `<div class="lb-empty">No scores yet</div>`;
    return;
  }

  const medals = ["🥇", "🥈", "🥉"];

  els.top10List.innerHTML = rows
    .map((row, index) => {
      const avatar = row.avatarUrl
        ? `<img src="${row.avatarUrl}" alt="avatar" class="lb-avatar-img">`
        : `<div class="lb-avatar-fallback">${(row.displayName || "?")
            .slice(0, 1)
            .toUpperCase()}</div>`;

      const rankDisplay = index < 3 ? medals[index] : `#${index + 1}`;

      return `
        <div class="lb-row">
          <div class="lb-rank">${rankDisplay}</div>
          <div class="lb-avatar">${avatar}</div>
          <div class="lb-name">${row.displayName || "Player"}</div>
          <div class="lb-score">${row.bestScore ?? 0}</div>
        </div>
      `;
    })
    .join("");
}

export async function refreshTop10() {
  const q = query(
    collection(db, "leaderboard_entries"),
    orderBy("bestScore", "desc"),
    limit(10)
  );

  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => d.data());
  renderTop10(rows);

  const user = auth.currentUser;
  if (!user || !els.myBest) return;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const best = userSnap.data().bestScore || 0;
    els.myBest.textContent = `My Best: ${best}`;
  } else {
    els.myBest.textContent = `My Best: 0`;
  }
}

export async function submitScore(score) {
  const numericScore = Number(score) || 0;
  const user = auth.currentUser;

  if (!user) {
    // Don't lose the score — remember it and ask the player to sign in / guest
    if (numericScore > 0) showSaveModal(numericScore);
    return;
  }

  hideSaveModal();

  const userRef = doc(db, "users", user.uid);
  const lbRef = doc(db, "leaderboard_entries", user.uid);

  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    alert("User profile not found.");
    return;
  }

  const userData = userSnap.data();
  const displayName = userData.displayName || "Player";
  const avatarUrl = userData.avatarUrl || "";
  const bestScore = userData.bestScore || 0;

  // Yeni skor eski best'i geçmiyorsa hiçbir şey yapma
  if (numericScore <= bestScore) {
    await refreshTop10();
    return;
  }

  // Önce user best score güncelle
  await setDoc(
    userRef,
    {
      bestScore: numericScore
    },
    { merge: true }
  );

  // Leaderboard'da user başına tek kayıt tut
  await setDoc(
    lbRef,
    {
      uid: user.uid,
      displayName,
      avatarUrl,
      bestScore: numericScore,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  await refreshTop10();
}

// Called after the player signs in / continues as guest — saves the score
// they earned while signed out so it is never lost.
export async function flushPendingScore() {
  if (pendingScore > 0 && auth.currentUser) {
    const score = pendingScore;
    pendingScore = 0;
    hideSaveModal();
    await submitScore(score);
  }
}

// Wire the save-score modal buttons to the existing auth handlers
const saveGoogleBtn = document.getElementById("save-google");
const saveGuestBtn = document.getElementById("save-guest");
const saveDismissBtn = document.getElementById("save-dismiss");

if (saveGoogleBtn) {
  saveGoogleBtn.onclick = () => window.DontBlinkAuthUI?.handleGoogleLogin();
}
if (saveGuestBtn) {
  saveGuestBtn.onclick = () => window.DontBlinkAuthUI?.handleGuestLogin();
}
if (saveDismissBtn) {
  saveDismissBtn.onclick = () => {
    pendingScore = 0;
    hideSaveModal();
  };
}

window.DontBlinkLeaderboard = {
  submitScore,
  refreshTop10,
  flushPendingScore
};

window.addEventListener("load", async () => {
  try {
    await refreshTop10();
  } catch (e) {
    console.error(e);
  }
});