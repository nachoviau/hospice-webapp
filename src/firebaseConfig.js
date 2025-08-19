// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDFER7GYx4oXUab5v_FaF3i8PYS6PxL_S8",
  authDomain: "hospice-san-camilo.firebaseapp.com",
  projectId: "hospice-san-camilo",
  storageBucket: "hospice-san-camilo.firebasestorage.app", // ← URL correcta
  messagingSenderId: "301594635477",
  appId: "1:301594635477:web:9e7ae33371be4d0a97465c",
  measurementId: "G-9YY64R6FMS"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Asegurar autenticación (anónima) para cumplir reglas que requieren request.auth
onAuthStateChanged(auth, (user) => {
  if (!user) {
    signInAnonymously(auth).catch(() => {});
  }
});