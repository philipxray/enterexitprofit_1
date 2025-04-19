// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBzQiAdFhQElAOCauADSnq_wSm8P5zMl3U",
    authDomain: "enterexitprofitcontent.firebaseapp.com",
    projectId: "enterexitprofitcontent",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);

firebase.firestore.setLogLevel('debug');

const db = firebase.firestore();






