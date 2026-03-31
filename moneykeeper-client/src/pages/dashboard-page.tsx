import {
    TrendingDown as ExpenseIcon,
    TrendingUp as IncomeIcon,
    AccountBalanceWallet as WalletIcon,
} from "@mui/icons-material";
import {
    Box,
    Card,
    CardContent,
    Chip,
    Grid,
    LinearProgress,
    Stack,
    Typography,
} from "@mui/material";
import { FormattedMessage, useIntl } from "react-intl";
import { useBudgetSummary } from "../hooks/use-budgets";
import { useTransactions } from "../hooks/use-transactions";
import { useWallets } from "../hooks/use-wallets";

function formatMoney(value: string | number) {
    return Number(value).toLocaleString("vi-VN");
}

export default function DashboardPage() {
    const intl = useIntl();
    const { data: wallets } = useWallets();
    const { data: transactions } = useTransactions();
    const { data: budgetSummary } = useBudgetSummary();

    const txList = transactions?.data;
    const totalBalance =
        wallets?.reduce((sum, w) => sum + Number(w.balance), 0) ?? 0;
    const totalIncome =
        txList
            ?.filter((t) => t.type === "income")
            .reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;
    const totalExpense =
        txList
            ?.filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;

    const summaryCards = [
        {
            labelId: "dashboard.totalBalance",
            value: formatMoney(totalBalance),
            icon: <WalletIcon />,
            color: "info.main",
        },
        {
            labelId: "dashboard.income",
            value: formatMoney(totalIncome),
            icon: <IncomeIcon />,
            color: "success.main",
        },
        {
            labelId: "dashboard.expense",
            value: formatMoney(totalExpense),
            icon: <ExpenseIcon />,
            color: "error.main",
        },
    ];

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                <FormattedMessage id="dashboard.title" />
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {summaryCards.map((card) => (
                    <Grid size={{ xs: 12, md: 4 }} key={card.labelId}>
                        <Card
                            sx={{
                                bgcolor: card.color,
                                color: "primary.contrastText",
                                position: "relative",
                                overflow: "hidden",
                            }}
                        >
                            <Box
                                sx={{
                                    position: "absolute",
                                    right: -20,
                                    top: -20,
                                    opacity: 0.15,
                                    fontSize: 120,
                                }}
                            >
                                {card.icon}
                            </Box>
                            <CardContent
                                sx={{
                                    position: "relative",
                                    zIndex: 1,
                                    py: 3,
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{ opacity: 0.85, mb: 1 }}
                                >
                                    <FormattedMessage id={card.labelId} />
                                </Typography>
                                <Typography
                                    variant="h4"
                                    sx={{ fontWeight: 800 }}
                                >
                                    {card.value}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Typography variant="h5" sx={{ mb: 2 }}>
                <FormattedMessage id="dashboard.budgetOverview" />
            </Typography>
            <Grid container spacing={2}>
                {budgetSummary?.map((budget) => (
                    <Grid size={{ xs: 12, md: 6 }} key={budget.id}>
                        <Card>
                            <CardContent>
                                <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    sx={{ mb: 1.5 }}
                                >
                                    <Typography
                                        variant="subtitle1"
                                        fontWeight={600}
                                    >
                                        {budget.is_global
                                            ? intl.formatMessage({
                                                  id: "dashboard.globalBudget",
                                              })
                                            : budget.category?.name ||
                                              budget.wallet?.name ||
                                              intl.formatMessage({
                                                  id: "dashboard.budget",
                                              })}
                                    </Typography>
                                    <Chip
                                        label={budget.period}
                                        size="small"
                                        color="primary"
                                        sx={{
                                            textTransform: "capitalize",
                                        }}
                                    />
                                </Stack>

                                <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    sx={{ mb: 1 }}
                                >
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {formatMoney(budget.spent)} /{" "}
                                        {formatMoney(budget.amount)}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color={
                                            budget.percentage > 90
                                                ? "error.main"
                                                : budget.percentage > 70
                                                  ? "warning.main"
                                                  : "primary.main"
                                        }
                                        fontWeight={600}
                                    >
                                        {Math.round(budget.percentage)}%
                                    </Typography>
                                </Stack>

                                <LinearProgress
                                    variant="determinate"
                                    value={Math.min(budget.percentage, 100)}
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        bgcolor: "rgba(148, 163, 184, 0.08)",
                                        "& .MuiLinearProgress-bar": {
                                            borderRadius: 4,
                                            bgcolor:
                                                budget.percentage > 90
                                                    ? "error.main"
                                                    : budget.percentage > 70
                                                      ? "warning.main"
                                                      : "primary.main",
                                        },
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
                {(!budgetSummary || budgetSummary.length === 0) && (
                    <Grid size={12}>
                        <Card>
                            <CardContent sx={{ textAlign: "center", py: 4 }}>
                                <Typography color="text.secondary">
                                    <FormattedMessage id="dashboard.noBudgets" />
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>

            <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
                <FormattedMessage id="dashboard.recentTransactions" />
            </Typography>
            <Card>
                <CardContent sx={{ p: 0 }}>
                    <Stack
                        divider={
                            <Box
                                sx={{
                                    borderBottom:
                                        "1px solid rgba(148,163,184,0.08)",
                                }}
                            />
                        }
                    >
                        {txList?.slice(0, 8).map((tx) => (
                            <Stack
                                key={tx.id}
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{ px: 3, py: 2 }}
                            >
                                <Box>
                                    <Typography
                                        variant="body1"
                                        fontWeight={500}
                                    >
                                        {tx.category?.name ||
                                            (tx.type === "transfer"
                                                ? intl.formatMessage({
                                                      id: "dashboard.transfer",
                                                  })
                                                : tx.note ||
                                                  intl.formatMessage({
                                                      id: "dashboard.transaction",
                                                  }))}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {tx.wallet.name}
                                        {tx.to_wallet
                                            ? ` → ${tx.to_wallet.name}`
                                            : ""}{" "}
                                        ·{" "}
                                        {new Date(tx.date).toLocaleDateString(
                                            "vi-VN",
                                        )}
                                    </Typography>
                                </Box>
                                <Typography
                                    variant="body1"
                                    fontWeight={700}
                                    color={
                                        tx.type === "income"
                                            ? "success.main"
                                            : tx.type === "expense"
                                              ? "error.main"
                                              : "info.main"
                                    }
                                >
                                    {tx.type === "income"
                                        ? "+"
                                        : tx.type === "expense"
                                          ? "-"
                                          : ""}
                                    {formatMoney(tx.amount)}
                                </Typography>
                            </Stack>
                        ))}
                        {(!txList || txList.length === 0) && (
                            <Box sx={{ textAlign: "center", py: 4 }}>
                                <Typography color="text.secondary">
                                    <FormattedMessage id="dashboard.noTransactions" />
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
}
