import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBXF_pMs5WNDL9Eeg-DN9jIys5jiHEh-LM",
  authDomain: "gigflow-5ad86.firebaseapp.com",
  projectId: "gigflow-5ad86",
  storageBucket: "gigflow-5ad86.firebasestorage.app",
  messagingSenderId: "991117121276",
  appId: "1:991117121276:web:08e08d02abe4690e292979",
  measurementId: "G-P764P66TZM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
