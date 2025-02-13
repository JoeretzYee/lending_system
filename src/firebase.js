// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  onSnapshot,
  writeBatch,
  doc,
  deleteDoc,
  updateDoc,
  where,
  query,
  Timestamp,
} from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDp6xaFRb66gEjhqdpsMfkO-nvZiWJtqPo",
  authDomain: "lending-system-b118e.firebaseapp.com",
  projectId: "lending-system-b118e",
  storageBucket: "lending-system-b118e.firebasestorage.app",
  messagingSenderId: "888578053945",
  appId: "1:888578053945:web:afae166961b6751a82fae8",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {
  db,
  collection,
  addDoc,
  getDoc,
  writeBatch,
  getDocs,
  doc,
  deleteDoc,
  onSnapshot,
  Timestamp,
  where,
  updateDoc,
  query,
};
