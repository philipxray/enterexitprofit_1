import { db } from "./firebase.js";
import { collection, addDoc } from "firebase/firestore";

async function testFirestore() {
    try {
        // Add a test document to Firestore
        const docRef = await addDoc(collection(db, "testCollection"), {
            message: "Hello, Firebase!"
        });
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

testFirestore();