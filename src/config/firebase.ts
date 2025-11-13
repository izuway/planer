import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  connectAuthEmulator,
  browserLocalPersistence,
  setPersistence 
} from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyACp4UJG1D6F38z7zRipHAwuofH_zAhw9c",
  authDomain: "planer-246d3.firebaseapp.com",
  projectId: "planer-246d3",
  storageBucket: "planer-246d3.firebasestorage.app",
  messagingSenderId: "77068073427",
  appId: "1:77068073427:web:57244b452b460de50bd726"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Set persistence to LOCAL (stores in localStorage)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting auth persistence:', error);
});

// Connect to emulator in development (optional)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
}

export default app;

