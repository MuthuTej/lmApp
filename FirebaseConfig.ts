import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAyT5T5r2qbMFtjjsSoagTDxOPZu1qvhF8",
  authDomain: "grabit-cff7e.firebaseapp.com",
  projectId: "grabit-cff7e",
  storageBucket: "grabit-cff7e.firebasestorage.app",
  messagingSenderId: "504567416385",
  appId: "1:504567416385:web:43a46f898e55bd56fda8c0",
};

export const FIREBASE_APP = initializeApp(firebaseConfig);

// ✅ Works perfectly in Expo
// ⚠️ Auth resets only on full app kill (not reload)
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);

export const db = getFirestore(FIREBASE_APP);
