import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

export interface Budget {
    id: string;
    name: string;
    amount: string;
    period: "day" | "week" | "month" | "year";
    is_global: boolean;
    sort_order: number;
    category_id: string | null;
    category: { id: string; name: string; icon: string | null } | null;
    wallet_id: string | null;
    wallet: { id: string; name: string } | null;
}

export interface BudgetSummary extends Budget {
    spent: string;
    remaining: string;
    percentage: number;
}

export function useBudgets() {
    return useQuery({
        queryKey: ["budgets"],
        queryFn: async () => {
            const { data } = await api.get<Budget[]>("/budgets");
            return data;
        },
    });
}

export function useBudgetSummary() {
    return useQuery({
        queryKey: ["budgets", "summary"],
        queryFn: async () => {
            const { data } = await api.get<BudgetSummary[]>("/budgets/summary");
            return data;
        },
    });
}

export function useCreateBudget() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: {
            name?: string;
            amount: string;
            period: "day" | "week" | "month" | "year";
            is_global?: boolean;
            category_id?: string;
            wallet_id?: string;
        }) => api.post("/budgets", payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
    });
}

export function useUpdateBudget() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            ...data
        }: {
            id: string;
            name?: string;
            amount?: string;
            period?: "day" | "week" | "month" | "year";
            sort_order?: number;
        }) => api.put(`/budgets/${id}`, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
    });
}

export function useDeleteBudget() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/budgets/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
    });
}

export function useReorderBudgets() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (items: { id: string; sort_order: number }[]) =>
            api.put("/budgets/reorder", { items }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
    });
}
