import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDuyboViRr9PVsfNaY30M4uM2UdH5PCGJs",
  authDomain: "elia-aa536.firebaseapp.com",
  projectId: "elia-aa536",
  storageBucket: "elia-aa536.firebasestorage.app",
  messagingSenderId: "530100158843",
  appId: "1:530100158843:web:5790dd64ccea2c52f63dde",
  measurementId: "G-Z795KHG60T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth exports
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore export
export const db = getFirestore(app);

// Analytics initialization with support check for SSR safety
export const analytics = typeof window !== "undefined" ? isSupported().then(yes => yes ? getAnalytics(app) : null) : null;

export default app;