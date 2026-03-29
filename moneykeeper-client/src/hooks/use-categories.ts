import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

export interface Category {
    id: string;
    name: string;
    type: "income" | "expense";
    icon: string | null;
    parent_id: string | null;
    is_default: boolean;
    children: Category[];
}

export function useCategories(type?: "income" | "expense") {
    return useQuery({
        queryKey: ["categories", type],
        queryFn: async () => {
            const params = type ? { type } : {};
            const { data } = await api.get<Category[]>("/categories", {
                params,
            });
            return data;
        },
    });
}

export function useCreateCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: {
            name: string;
            type: "income" | "expense";
            icon?: string;
            parent_id?: string;
        }) => api.post("/categories", payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
    });
}

export function useUpdateCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            ...data
        }: {
            id: string;
            name?: string;
            icon?: string;
            parent_id?: string;
        }) => api.put(`/categories/${id}`, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
    });
}

export function useDeleteCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/categories/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
    });
}
