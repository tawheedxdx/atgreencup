import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC0SRUdE1iym3n6z6wYfxMiQKyqKqMmPwc",
  authDomain: "at-greencup-admin.firebaseapp.com",
  projectId: "at-greencup-admin",
  storageBucket: "at-greencup-admin.firebasestorage.app",
  messagingSenderId: "173949430175",
  appId: "1:173949430175:web:fb6fd210450f91bdaaf5aa"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkUsers() {
  console.log("Fetching users...");
  try {
    const snap = await getDocs(collection(db, 'users'));
    console.log(`Found ${snap.size} users:`);
    snap.forEach((doc) => {
      console.log(`UID: ${doc.id}`);
      console.log(`  Data:`, JSON.stringify(doc.data(), null, 2));
    });
  } catch (err) {
    console.error("Error fetching users:", err);
  }
}

checkUsers();
