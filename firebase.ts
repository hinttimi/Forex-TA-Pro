import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, doc, getDoc, setDoc } from "firebase/firestore";
import { MENTOR_PERSONAS, MENTOR_VOICES } from "./constants/mentorSettings";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCXGUEncqH09pfZ6ae7E_Vwd1CywQRIwqI",
  authDomain: "gen-lang-client-0922128235.firebaseapp.com",
  projectId: "gen-lang-client-0922128235",
  storageBucket: "gen-lang-client-0922128235.appspot.com",
  messagingSenderId: "1021772702627",
  appId: "1:1021772702627:web:83b37eb385b926dc3c7016",
  measurementId: "G-JTXVSG0Z97"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with offline persistence using the new API.
// This replaces the deprecated enableIndexedDbPersistence() function and resolves the warning.
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache()
});

export const googleProvider = new GoogleAuthProvider();

/**
 * Creates a user document in Firestore if one doesn't already exist.
 * This is called after a new user signs up to initialize their data.
 * @param user The user object from Firebase Authentication.
 * @param additionalData Optional data, like a username, to add to the profile.
 */
export const createUserProfileDocument = async (user: any, additionalData: { username?: string } = {}) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { email } = user;
    const createdAt = new Date();
    try {
      await setDoc(userRef, {
        email,
        createdAt,
        username: additionalData.username || email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ''),
        // Initialize with empty/default values
        apiKey: null,
        completedLessons: [],
        completionCounts: { correctPatterns: 0, simulatorRuns: 0, savedAnalyses: 0, loggedTrades: 0 },
        unlockedBadges: [],
        tradingPlan: { strategy: '', riskManagement: '', marketConditions: '' },
        mentorSettings: {
            personaId: MENTOR_PERSONAS[0].id,
            voiceId: MENTOR_VOICES[0].id,
        },
      });
    } catch (error) {
      console.error("Error creating user profile document:", error);
    }
  }
};