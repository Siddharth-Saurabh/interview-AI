import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyATDASajOpBS5kCxzhR2ehaTOIE0EQtsnU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "interviewai-2c644.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "interviewai-2c644",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "interviewai-2c644.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "610785496025",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:610785496025:web:064f2206e26295397827c8",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-J3NS4NT3WY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { app };
