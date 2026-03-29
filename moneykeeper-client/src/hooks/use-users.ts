import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuthStore } from "../stores/auth.store";

interface UserProfile {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    role: "user" | "admin";
    created_at: string;
}

export function useProfile() {
    const { firebaseUser, setProfile } = useAuthStore();

    return useQuery({
        queryKey: ["profile"],
        queryFn: async () => {
            const { data } = await api.get<UserProfile>("/users/me");
            setProfile(data);
            return data;
        },
        enabled: !!firebaseUser,
    });
}

export function useUsers() {
    return useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const { data } = await api.get<UserProfile[]>("/users");
            return data;
        },
    });
}
