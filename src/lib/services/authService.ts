import { 
  signInWithPopup, 
  signOut as firebaseSignOut,
  User,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, facebookProvider } from '../firebase';

export const authService = {
  /**
   * Login with Email and Password
   */
  async loginWithEmail(email: string, password: string): Promise<User | null> {
    try {
      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        console.warn("Firebase not configured.");
        return null;
      }
      const result = await signInWithEmailAndPassword(auth, email, password);
      await this.syncUserToFirestore(result.user);
      return result.user;
    } catch (error) {
      console.error("Email login failed:", error);
      throw error;
    }
  },

  /**
   * Register with Email, Password and Name
   */
  async registerWithEmail(email: string, password: string, name: string): Promise<User | null> {
    try {
      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        console.warn("Firebase not configured.");
        return null;
      }
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      
      // Sync to Firestore
      await this.syncUserToFirestore(auth.currentUser || result.user);
      return result.user;
    } catch (error) {
      console.error("Email registration failed:", error);
      throw error;
    }
  },

  /**
   * Opens Firebase popup for Google Login
   */
  async loginWithGoogle(): Promise<User | null> {
    try {
      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        console.warn("Firebase not configured. Using mock environment.");
        return null; // Mock mode fallback
      }
      
      const result = await signInWithPopup(auth, googleProvider);
      await this.syncUserToFirestore(result.user);
      return result.user;
    } catch (error) {
      console.error("Google login failed:", error);
      throw error;
    }
  },

  /**
   * Opens Firebase popup for Facebook Login
   */
  async loginWithFacebook(): Promise<User | null> {
    try {
      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        console.warn("Firebase not configured. Using mock environment.");
        return null;
      }

      const result = await signInWithPopup(auth, facebookProvider);
      await this.syncUserToFirestore(result.user);
      return result.user;
    } catch (error) {
      console.error("Facebook login failed:", error);
      throw error;
    }
  },

  /**
   * Signs out the current user
   */
  async logout(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  },

  /**
   * Synchronizes authenticated user data with Firestore '/users' collection.
   * If it's a new user, saves their initial details.
   */
  async syncUserToFirestore(user: User): Promise<void> {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: "user",
          createdAt: serverTimestamp(),
          orderCount: 0
        });
      }
    } catch (error) {
      console.error("Failed to sync user to Firestore:", error);
    }
  }
};
