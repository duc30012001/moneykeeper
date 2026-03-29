import type { User } from "firebase/auth";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { create } from "zustand";
import { auth, googleProvider } from "../lib/firebase";

interface UserProfile {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    role: "user" | "admin";
}

interface AuthState {
    firebaseUser: User | null;
    profile: UserProfile | null;
    loading: boolean;
    setFirebaseUser: (user: User | null) => void;
    setProfile: (profile: UserProfile | null) => void;
    setLoading: (loading: boolean) => void;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    firebaseUser: null,
    profile: null,
    loading: true,

    setFirebaseUser: (user) => set({ firebaseUser: user }),
    setProfile: (profile) => set({ profile }),
    setLoading: (loading) => set({ loading }),

    loginWithGoogle: async () => {
        await signInWithPopup(auth, googleProvider);
    },

    logout: async () => {
        await signOut(auth);
        set({ firebaseUser: null, profile: null });
    },
}));

// Listen to auth state changes
onAuthStateChanged(auth, (user) => {
    useAuthStore.getState().setFirebaseUser(user);
    useAuthStore.getState().setLoading(false);
});
