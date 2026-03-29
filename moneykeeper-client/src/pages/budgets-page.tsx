import {
    Add as AddIcon,
    Delete as DeleteIcon,
    DragIndicator as DragIcon,
    Edit as EditIcon,
} from "@mui/icons-material";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    LinearProgress,
    MenuItem,
    Select,
    Stack,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Budget, BudgetSummary } from "../hooks/use-budgets";
import {
    useBudgetSummary,
    useCreateBudget,
    useDeleteBudget,
    useReorderBudgets,
    useUpdateBudget,
} from "../hooks/use-budgets";
import { useCategories } from "../hooks/use-categories";
import { useWallets } from "../hooks/use-wallets";

function formatMoney(value: string | number) {
    return Number(value).toLocaleString("vi-VN");
}

function SortableBudgetCard({
    budget,
    onEdit,
    onDelete,
    intl,
}: {
    budget: BudgetSummary;
    onEdit: (b: Budget) => void;
    onDelete: (id: string) => void;
    intl: ReturnType<typeof useIntl>;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: budget.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} ref={setNodeRef} style={style}>
            <Card
                sx={{
                    transition: "transform 0.2s",
                    "&:hover": { transform: isDragging ? undefined : "translateY(-4px)" },
                }}
            >
                <CardContent>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="start"
                        sx={{ mb: 2 }}
                    >
                        <Box>
                            <Typography
                                variant="subtitle1"
                                fontWeight={600}
                            >
                                {budget.name ||
                                    (budget.is_global
                                        ? intl.formatMessage({
                                              id: "budgets.globalBudget",
                                          })
                                        : budget.category?.name ||
                                          budget.wallet?.name ||
                                          intl.formatMessage({
                                              id: "budgets.budget",
                                          }))}
                            </Typography>
                            <Chip
                                label={budget.period}
                                size="small"
                                sx={{
                                    mt: 0.5,
                                    color: "primary.main",
                                    textTransform: "capitalize",
                                }}
                            />
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                            <IconButton
                                size="small"
                                sx={{ cursor: "grab", "&:active": { cursor: "grabbing" } }}
                                {...attributes}
                                {...listeners}
                            >
                                <DragIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                                size="small"
                                onClick={() => onEdit(budget)}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                                size="small"
                                color="error"
                                onClick={() => onDelete(budget.id)}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Stack>
                    </Stack>
                    <Typography
                        variant="h5"
                        fontWeight={800}
                        sx={{ mb: 0.5 }}
                    >
                        {formatMoney(budget.spent)}
                        <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            sx={{ ml: 1 }}
                        >
                            / {formatMoney(budget.amount)}
                        </Typography>
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={Math.min(budget.percentage, 100)}
                        sx={{
                            height: 10,
                            borderRadius: 5,
                            mt: 1.5,
                            "& .MuiLinearProgress-bar": {
                                borderRadius: 5,
                                bgcolor:
                                    budget.percentage > 90
                                        ? "error.main"
                                        : budget.percentage > 70
                                          ? "warning.main"
                                          : "primary.main",
                            },
                        }}
                    />
                    <Typography
                        variant="body2"
                        sx={{
                            mt: 1,
                            textAlign: "right",
                            fontWeight: 600,
                            color:
                                budget.percentage > 90
                                    ? "error.main"
                                    : budget.percentage > 70
                                      ? "warning.main"
                                      : "primary.main",
                        }}
                    >
                        {Math.round(budget.percentage)}%
                    </Typography>
                </CardContent>
            </Card>
        </Grid>
    );
}

export default function BudgetsPage() {
    const intl = useIntl();
    const { data: summary } = useBudgetSummary();
    const { data: wallets } = useWallets();
    const { data: expenseCategories } = useCategories("expense");
    const createBudget = useCreateBudget();
    const updateBudget = useUpdateBudget();
    const deleteBudget = useDeleteBudget();
    const reorderBudgets = useReorderBudgets();

    const [dialog, setDialog] = useState<{ open: boolean; budget?: Budget }>({
        open: false,
    });
    const [errors, setErrors] = useState<{ amount?: string }>({});
    const [form, setForm] = useState({
        name: "",
        amount: "",
        period: "month" as "day" | "week" | "month" | "year",
        is_global: false,
        category_id: "",
        wallet_id: "",
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const openCreate = () => {
        setForm({
            name: "",
            amount: "",
            period: "month",
            is_global: false,
            category_id: "",
            wallet_id: "",
        });
        setErrors({});
        setDialog({ open: true });
    };
    const openEdit = (budget: Budget) => {
        setForm({
            name: budget.name,
            amount: budget.amount,
            period: budget.period,
            is_global: budget.is_global,
            category_id: budget.category_id || "",
            wallet_id: budget.wallet_id || "",
        });
        setErrors({});
        setDialog({ open: true, budget });
    };

    const validate = (): boolean => {
        const newErrors: { amount?: string } = {};
        if (!form.amount || Number(form.amount) <= 0) {
            newErrors.amount = intl.formatMessage({ id: "budgets.errorAmount" });
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        if (dialog.budget) {
            await updateBudget.mutateAsync({
                id: dialog.budget.id,
                name: form.name,
                amount: form.amount,
                period: form.period,
            });
        } else {
            await createBudget.mutateAsync({
                name: form.name,
                amount: form.amount,
                period: form.period,
                is_global: form.is_global,
                category_id: form.category_id || undefined,
                wallet_id: form.wallet_id || undefined,
            });
        }
        setDialog({ open: false });
    };

    const handleDelete = async (id: string) => {
        if (confirm(intl.formatMessage({ id: "budgets.deleteConfirm" }))) {
            await deleteBudget.mutateAsync(id);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id || !summary) return;

        const oldIndex = summary.findIndex((b) => b.id === active.id);
        const newIndex = summary.findIndex((b) => b.id === over.id);
        const reordered = arrayMove(summary, oldIndex, newIndex);

        await reorderBudgets.mutateAsync(
            reordered.map((b, i) => ({ id: b.id, sort_order: i })),
        );
    };

    const flattenCategories = (
        cats: typeof expenseCategories,
        depth = 0,
    ): { id: string; name: string; depth: number }[] => {
        if (!cats) return [];
        return cats.flatMap((c) => [
            { id: c.id, name: c.name, depth },
            ...flattenCategories(c.children, depth + 1),
        ]);
    };

    const budgetIds = summary?.map((b) => b.id) ?? [];

    return (
        <Box>
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 3 }}
            >
                <Typography variant="h4">
                    <FormattedMessage id="budgets.title" />
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={openCreate}
                >
                    <FormattedMessage id="budgets.new" />
                </Button>
            </Stack>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={budgetIds} strategy={rectSortingStrategy}>
                    <Grid container spacing={3}>
                        {summary?.map((budget) => (
                            <SortableBudgetCard
                                key={budget.id}
                                budget={budget}
                                onEdit={openEdit}
                                onDelete={handleDelete}
                                intl={intl}
                            />
                        ))}
                        {(!summary || summary.length === 0) && (
                            <Grid size={12}>
                                <Card>
                                    <CardContent sx={{ textAlign: "center", py: 6 }}>
                                        <Typography color="text.secondary">
                                            <FormattedMessage id="budgets.empty" />
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        )}
                    </Grid>
                </SortableContext>
            </DndContext>

            <Dialog
                open={dialog.open}
                onClose={() => setDialog({ open: false })}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>
                    {dialog.budget ? (
                        <FormattedMessage id="budgets.edit" />
                    ) : (
                        <FormattedMessage id="budgets.new" />
                    )}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            autoFocus
                            label={intl.formatMessage({
                                id: "budgets.nameLabel",
                            })}
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            placeholder={intl.formatMessage({
                                id: "budgets.namePlaceholder",
                            })}
                        />
                        <TextField
                            label={intl.formatMessage({
                                id: "budgets.amountLabel",
                            })}
                            type="number"
                            value={form.amount}
                            onChange={(e) => {
                                setForm({ ...form, amount: e.target.value });
                                if (errors.amount) setErrors({ ...errors, amount: undefined });
                            }}
                            error={!!errors.amount}
                            helperText={errors.amount}
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel>
                                <FormattedMessage id="budgets.periodLabel" />
                            </InputLabel>
                            <Select
                                value={form.period}
                                label={intl.formatMessage({
                                    id: "budgets.periodLabel",
                                })}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        period: e.target
                                            .value as typeof form.period,
                                    })
                                }
                            >
                                <MenuItem value="day">
                                    <FormattedMessage id="budgets.periodDay" />
                                </MenuItem>
                                <MenuItem value="week">
                                    <FormattedMessage id="budgets.periodWeek" />
                                </MenuItem>
                                <MenuItem value="month">
                                    <FormattedMessage id="budgets.periodMonth" />
                                </MenuItem>
                                <MenuItem value="year">
                                    <FormattedMessage id="budgets.periodYear" />
                                </MenuItem>
                            </Select>
                        </FormControl>
                        {!dialog.budget && (
                            <>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={form.is_global}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    is_global: e.target.checked,
                                                    category_id: "",
                                                    wallet_id: "",
                                                })
                                            }
                                        />
                                    }
                                    label={intl.formatMessage({
                                        id: "budgets.globalToggle",
                                    })}
                                />
                                {!form.is_global && (
                                    <>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>
                                                <FormattedMessage id="budgets.categoryOptional" />
                                            </InputLabel>
                                            <Select
                                                value={form.category_id}
                                                label={intl.formatMessage({
                                                    id: "budgets.categoryOptional",
                                                })}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        category_id:
                                                            e.target.value,
                                                    })
                                                }
                                            >
                                                <MenuItem value="">
                                                    <FormattedMessage id="common.none" />
                                                </MenuItem>
                                                {flattenCategories(
                                                    expenseCategories,
                                                ).map((cat) => (
                                                    <MenuItem
                                                        key={cat.id}
                                                        value={cat.id}
                                                        sx={{
                                                            pl:
                                                                2 +
                                                                cat.depth * 2,
                                                        }}
                                                    >
                                                        {cat.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>
                                                <FormattedMessage id="budgets.walletOptional" />
                                            </InputLabel>
                                            <Select
                                                value={form.wallet_id}
                                                label={intl.formatMessage({
                                                    id: "budgets.walletOptional",
                                                })}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        wallet_id:
                                                            e.target.value,
                                                    })
                                                }
                                            >
                                                <MenuItem value="">
                                                    <FormattedMessage id="common.none" />
                                                </MenuItem>
                                                {wallets?.map((w) => (
                                                    <MenuItem
                                                        key={w.id}
                                                        value={w.id}
                                                    >
                                                        {w.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </>
                                )}
                            </>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialog({ open: false })}>
                        <FormattedMessage id="common.cancel" />
                    </Button>
                    <Button variant="contained" onClick={handleSubmit}>
                        {dialog.budget ? (
                            <FormattedMessage id="common.update" />
                        ) : (
                            <FormattedMessage id="common.create" />
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
