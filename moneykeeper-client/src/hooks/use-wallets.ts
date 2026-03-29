import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

export interface Wallet {
    id: string;
    name: string;
    balance: number;
    initial_balance?: number;
    sort_order: number;
    user_id: string;
    created_at: string;
    updated_at: string;
}

export function useWallets() {
    return useQuery({
        queryKey: ["wallets"],
        queryFn: async () => {
            const { data } = await api.get<Wallet[]>("/wallets");
            return data;
        },
    });
}

export function useCreateWallet() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: { name: string; initial_balance?: number }) =>
            api.post("/wallets", payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["wallets"] }),
    });
}

export function useUpdateWallet() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            ...data
        }: {
            id: string;
            name?: string;
            initial_balance?: number;
            sort_order?: number;
        }) => api.put(`/wallets/${id}`, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["wallets"] }),
    });
}

export function useDeleteWallet() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/wallets/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["wallets"] }),
    });
}

export function useReorderWallets() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (items: { id: string; sort_order: number }[]) =>
            api.put("/wallets/reorder", { items }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["wallets"] }),
    });
}
