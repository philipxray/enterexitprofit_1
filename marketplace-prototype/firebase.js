// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBzQiAdFhQElAOCauADSnq_wSm8P5zMl3U",
    authDomain: "enterexitprofitcontent.firebaseapp.com",
    projectId: "enterexitprofitcontent",
    storageBucket: "enterexitprofitcontent.appspot.com",
    messagingSenderId: "568480349457",
    appId: "1:568480349457:web:866a7363133fbd57f460b0",
    measurementId: "G-4E5CGRNMJW"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Initialize Auth
const auth = firebase.auth();

// Initialize Firestore
const db = firebase.firestore();

// Make `auth` and `db` globally accessible
window.auth = auth;
window.db = db;

