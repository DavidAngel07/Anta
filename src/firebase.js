// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBqQ44EUezT6zfTnA82cFIU0SRF6hdIpkY",
  authDomain: "anta-4aa5c.firebaseapp.com",
  projectId: "anta-4aa5c",
  storageBucket: "anta-4aa5c.firebasestorage.app",
  messagingSenderId: "21041639585",
  appId: "1:21041639585:web:93899b0c5e17265650c0e0",
  measurementId: "G-2GPSBFGWX5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);