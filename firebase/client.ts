
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBPBzj5HHgwkFrXlW848ULP8PhRvv3N7bM",
    authDomain: "hirewise-efbe5.firebaseapp.com",
    projectId: "hirewise-efbe5",
    storageBucket: "hirewise-efbe5.firebasestorage.app",
    messagingSenderId: "801566091545",
    appId: "1:801566091545:web:9d0527238134091a5c3d88",
    measurementId: "G-XL2RZ6NVBV"
};

const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app)