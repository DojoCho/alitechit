import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAgDPtGwekFkxudH2gPDFi7FuL3WDm06-0",
  authDomain: "dontblink-game.firebaseapp.com",
  projectId: "dontblink-game",
  storageBucket: "dontblink-game.firebasestorage.app",
  messagingSenderId: "405633312028",
  appId: "1:405633312028:web:3af3f5e5722aa7b86786d9"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account"
});

export function makeGuestName() {
  const n = Math.floor(100 + Math.random() * 900);
  return `Wanderer${n}`;
}