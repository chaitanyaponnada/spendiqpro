

'use client';

import * as React from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfileData } from '@/types';

export interface UserProfile extends FirebaseUser, Partial<UserProfileData> {}

export function useAuth() {
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchUserData = React.useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfileData;
          setUser({ ...firebaseUser, ...userData });
        } else {
          // This case can happen during signup before the Firestore doc is created
          setUser(firebaseUser);
        }
      } catch (error) {
         console.error("Error fetching user data:", error);
         // Set user with auth data only if firestore fails
         setUser(firebaseUser);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      fetchUserData(firebaseUser);
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  return { 
    user, 
    loading, 
    // Add a manual refetch function
    refetchUser: () => fetchUserData(auth.currentUser) 
  };
}
