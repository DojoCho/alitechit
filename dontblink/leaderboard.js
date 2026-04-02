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
  myBest: document.getElementById("my-best-score")
};

function renderTop10(rows) {
  if (!els.top10List) return;

  if (!rows.length) {
    els.top10List.innerHTML = `<div class="lb-empty">No scores yet</div>`;
    return;
  }

  els.top10List.innerHTML = rows
    .map((row, index) => {
      const avatar = row.avatarUrl
        ? `<img src="${row.avatarUrl}" alt="avatar" class="lb-avatar-img">`
        : `<div class="lb-avatar-fallback">${(row.displayName || "?")
            .slice(0, 1)
            .toUpperCase()}</div>`;

      return `
        <div class="lb-row">
          <div class="lb-rank">#${index + 1}</div>
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
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in or continue as guest first.");
    return;
  }

  const numericScore = Number(score) || 0;

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

window.DontBlinkLeaderboard = {
  submitScore,
  refreshTop10
};

window.addEventListener("load", async () => {
  try {
    await refreshTop10();
  } catch (e) {
    console.error(e);
  }
});