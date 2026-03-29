import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

export interface Transaction {
    id: string;
    amount: string;
    type: "income" | "expense" | "transfer";
    note: string | null;
    date: string;
    wallet_id: string;
    wallet: { id: string; name: string };
    to_wallet_id: string | null;
    to_wallet: { id: string; name: string } | null;
    category_id: string | null;
    category: { id: string; name: string; icon: string | null } | null;
    created_at: string;
}

export interface TransactionQuery {
    type?: "income" | "expense" | "transfer";
    wallet_id?: string;
    category_id?: string;
    from_date?: string;
    to_date?: string;
}

export function useTransactions(query?: TransactionQuery) {
    return useQuery({
        queryKey: ["transactions", query],
        queryFn: async () => {
            const { data } = await api.get<Transaction[]>("/transactions", {
                params: query,
            });
            return data;
        },
    });
}

export function useCreateTransaction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: {
            amount: string;
            type: "income" | "expense" | "transfer";
            note?: string;
            date: string;
            wallet_id: string;
            to_wallet_id?: string;
            category_id?: string;
        }) => api.post("/transactions", payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["transactions"] });
            qc.invalidateQueries({ queryKey: ["wallets"] });
            qc.invalidateQueries({ queryKey: ["budgets"] });
        },
    });
}

export function useUpdateTransaction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            ...data
        }: {
            id: string;
            amount?: string;
            note?: string;
            date?: string;
            category_id?: string;
        }) => api.put(`/transactions/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["transactions"] });
            qc.invalidateQueries({ queryKey: ["wallets"] });
            qc.invalidateQueries({ queryKey: ["budgets"] });
        },
    });
}

export function useDeleteTransaction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/transactions/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["transactions"] });
            qc.invalidateQueries({ queryKey: ["wallets"] });
            qc.invalidateQueries({ queryKey: ["budgets"] });
        },
    });
}
