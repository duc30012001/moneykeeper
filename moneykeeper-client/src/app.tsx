import { Box, CircularProgress } from "@mui/material";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./components/layout/main-layout";
import { useProfile } from "./hooks/use-users";
import AdminUsersPage from "./pages/admin-users-page";
import BudgetsPage from "./pages/budgets-page";
import CategoriesPage from "./pages/categories-page";
import DashboardPage from "./pages/dashboard-page";
import LoginPage from "./pages/login-page";
import TransactionsPage from "./pages/transactions-page";
import WalletsPage from "./pages/wallets-page";
import { useAuthStore } from "./stores/auth.store";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { firebaseUser, loading } = useAuthStore();

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!firebaseUser) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
    const { profile } = useAuthStore();
    if (profile?.role !== "admin") return <Navigate to="/" replace />;
    return <>{children}</>;
}

function AppRoutes() {
    useProfile();

    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
                element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/" element={<DashboardPage />} />
                <Route path="/wallets" element={<WalletsPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/budgets" element={<BudgetsPage />} />
                <Route
                    path="/admin/users"
                    element={
                        <AdminRoute>
                            <AdminUsersPage />
                        </AdminRoute>
                    }
                />
            </Route>
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
}
