import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
} from "@mui/icons-material";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormHelperText,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useCategories } from "../hooks/use-categories";
import type { Transaction } from "../hooks/use-transactions";
import {
    useCreateTransaction,
    useDeleteTransaction,
    useTransactions,
    useUpdateTransaction,
} from "../hooks/use-transactions";
import { useWallets } from "../hooks/use-wallets";

type TxType = "income" | "expense" | "transfer";

function formatMoney(value: string | number) {
    return Number(value).toLocaleString("vi-VN");
}

function formatDateTime(dateStr: string) {
    const d = new Date(dateStr);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    const dd = d.getDate().toString().padStart(2, "0");
    const MM = (d.getMonth() + 1).toString().padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${hh}:${mm} ${dd}/${MM}/${yyyy}`;
}

function toDatetimeLocalValue(dateStr: string) {
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const MM = (d.getMonth() + 1).toString().padStart(2, "0");
    const dd = d.getDate().toString().padStart(2, "0");
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

interface FormErrors {
    amount?: string;
    date?: string;
    wallet_id?: string;
    to_wallet_id?: string;
    category_id?: string;
}

export default function TransactionsPage() {
    const intl = useIntl();
    const [filterType, setFilterType] = useState<TxType | "">("");
    const { data: transactions, isLoading } = useTransactions(
        filterType ? { type: filterType } : undefined,
    );
    const { data: wallets } = useWallets();
    const { data: incomeCategories } = useCategories("income");
    const { data: expenseCategories } = useCategories("expense");
    const createTransaction = useCreateTransaction();
    const updateTransaction = useUpdateTransaction();
    const deleteTransaction = useDeleteTransaction();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});
    const [form, setForm] = useState({
        amount: "",
        type: "expense" as TxType,
        note: "",
        date: toDatetimeLocalValue(new Date().toISOString()),
        wallet_id: "",
        to_wallet_id: "",
        category_id: "",
    });

    const resetForm = () => {
        setForm({
            amount: "",
            type: "expense",
            note: "",
            date: toDatetimeLocalValue(new Date().toISOString()),
            wallet_id: "",
            to_wallet_id: "",
            category_id: "",
        });
        setErrors({});
        setEditingTx(null);
    };

    const openCreate = () => {
        resetForm();
        setDialogOpen(true);
    };

    const openEdit = (tx: Transaction) => {
        setEditingTx(tx);
        setForm({
            amount: tx.amount,
            type: tx.type,
            note: tx.note || "",
            date: toDatetimeLocalValue(tx.date),
            wallet_id: tx.wallet_id,
            to_wallet_id: tx.to_wallet_id || "",
            category_id: tx.category_id || "",
        });
        setErrors({});
        setDialogOpen(true);
    };

    const validate = (): boolean => {
        const newErrors: FormErrors = {};

        if (!form.amount || Number(form.amount) <= 0) {
            newErrors.amount = intl.formatMessage({
                id: "transactions.errorAmount",
            });
        }
        if (!form.date) {
            newErrors.date = intl.formatMessage({
                id: "transactions.errorDate",
            });
        }
        if (!form.wallet_id) {
            newErrors.wallet_id = intl.formatMessage({
                id: "transactions.errorWallet",
            });
        }
        if (form.type === "transfer" && !form.to_wallet_id) {
            newErrors.to_wallet_id = intl.formatMessage({
                id: "transactions.errorToWallet",
            });
        }
        if (form.type !== "transfer" && !form.category_id) {
            newErrors.category_id = intl.formatMessage({
                id: "transactions.errorCategory",
            });
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        if (editingTx) {
            await updateTransaction.mutateAsync({
                id: editingTx.id,
                amount: form.amount,
                note: form.note || undefined,
                date: new Date(form.date).toISOString(),
                category_id:
                    form.type !== "transfer"
                        ? form.category_id || undefined
                        : undefined,
            });
        } else {
            await createTransaction.mutateAsync({
                amount: form.amount,
                type: form.type,
                note: form.note || undefined,
                date: new Date(form.date).toISOString(),
                wallet_id: form.wallet_id,
                to_wallet_id:
                    form.type === "transfer" ? form.to_wallet_id : undefined,
                category_id:
                    form.type !== "transfer" ? form.category_id : undefined,
            });
        }
        setDialogOpen(false);
        resetForm();
    };

    const handleDelete = async (id: string) => {
        if (
            confirm(
                intl.formatMessage({
                    id: "transactions.deleteConfirm",
                }),
            )
        ) {
            await deleteTransaction.mutateAsync(id);
        }
    };

    const categories =
        form.type === "income"
            ? incomeCategories
            : form.type === "expense"
              ? expenseCategories
              : [];

    const flattenCategories = (
        cats: typeof categories,
        depth = 0,
    ): { id: string; name: string; icon: string | null; depth: number }[] => {
        if (!cats) return [];
        return cats.flatMap((cat) => [
            { id: cat.id, name: cat.name, icon: cat.icon, depth },
            ...flattenCategories(cat.children, depth + 1),
        ]);
    };

    const filterLabels: Record<string, string> = {
        "": intl.formatMessage({ id: "common.all" }),
        income: intl.formatMessage({ id: "transactions.typeIncome" }),
        expense: intl.formatMessage({ id: "transactions.typeExpense" }),
        transfer: intl.formatMessage({
            id: "transactions.typeTransfer",
        }),
    };

    const columns: GridColDef[] = [
        {
            field: "date",
            headerName: intl.formatMessage({
                id: "transactions.date",
            }),
            width: 160,
            valueFormatter: (value: string) => formatDateTime(value),
        },
        // {
        //     field: "type",
        //     headerName: intl.formatMessage({
        //         id: "transactions.type",
        //     }),
        //     width: 120,
        //     renderCell: (params) => (
        //         <Chip
        //             label={intl.formatMessage({
        //                 id: `transactions.type${params.value.charAt(0).toUpperCase() + params.value.slice(1)}`,
        //             })}
        //             size="small"
        //             color={
        //                 params.value === "income"
        //                     ? "success"
        //                     : params.value === "expense"
        //                       ? "error"
        //                       : "info"
        //             }
        //         />
        //     ),
        // },
        {
            field: "category",
            headerName: intl.formatMessage({
                id: "transactions.category",
            }),
            flex: 1.5,
            minWidth: 120,
            valueGetter: (
                _value: unknown,
                row: { category?: { name: string } },
            ) => row.category?.name || "-",
        },
        {
            field: "wallet",
            headerName: intl.formatMessage({
                id: "transactions.wallet",
            }),
            flex: 1,
            minWidth: 140,
            valueGetter: (
                _value: unknown,
                row: {
                    wallet: { name: string };
                    to_wallet?: { name: string } | null;
                },
            ) =>
                row.to_wallet
                    ? `${row.wallet.name} → ${row.to_wallet.name}`
                    : row.wallet.name,
        },
        {
            field: "note",
            headerName: intl.formatMessage({
                id: "transactions.note",
            }),
            flex: 1.5,
            minWidth: 150,
            valueFormatter: (value: string | null) => value || "-",
        },
        {
            field: "amount",
            headerName: intl.formatMessage({
                id: "transactions.amount",
            }),
            width: 140,
            minWidth: 100,
            headerAlign: "right",
            align: "right",
            renderCell: (params) => {
                const type = params.row.type;
                const prefix =
                    type === "income" ? "+" : type === "expense" ? "-" : "";
                const color =
                    type === "income"
                        ? "success.main"
                        : type === "expense"
                          ? "error.main"
                          : "info.main";
                return (
                    <Typography variant="body2" sx={{ color, fontWeight: 600 }}>
                        {prefix}
                        {formatMoney(params.value)}
                    </Typography>
                );
            },
        },
        {
            field: "actions",
            headerName: intl.formatMessage({
                id: "transactions.actions",
            }),
            width: 100,
            sortable: false,
            filterable: false,
            headerAlign: "center",
            align: "center",
            renderCell: (params) => (
                <Stack direction="row" spacing={0.5}>
                    <IconButton
                        size="small"
                        onClick={() => openEdit(params.row)}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(params.row.id)}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Stack>
            ),
        },
    ];

    return (
        <Box>
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 3 }}
            >
                <Typography variant="h4">
                    <FormattedMessage id="transactions.title" />
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={openCreate}
                >
                    <FormattedMessage id="transactions.new" />
                </Button>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                {(["", "income", "expense", "transfer"] as const).map(
                    (type) => (
                        <Chip
                            key={type}
                            label={filterLabels[type]}
                            onClick={() => setFilterType(type)}
                            sx={{
                                textTransform: "capitalize",
                                ...(filterType === type
                                    ? {
                                          color: "primary.contrastText",
                                          bgcolor: "primary.main",
                                      }
                                    : {}),
                            }}
                        />
                    ),
                )}
            </Stack>

            <Box sx={{ width: "100%", overflowX: "auto" }}>
                <DataGrid
                    rows={transactions?.data ?? []}
                    columns={columns}
                    loading={isLoading}
                    autoHeight
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 10 },
                        },
                        sorting: {
                            sortModel: [{ field: "date", sort: "desc" }],
                        },
                    }}
                    disableRowSelectionOnClick
                    sx={{
                        minWidth: 800,
                        border: "none",
                        "& .MuiDataGrid-columnHeaders": {
                            bgcolor: "grey.50",
                        },
                        "& .MuiDataGrid-cell": {
                            display: "flex",
                            alignItems: "center",
                        },
                    }}
                    localeText={{
                        noRowsLabel: intl.formatMessage({
                            id: "transactions.empty",
                        }),
                    }}
                />
            </Box>

            <Dialog
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                    resetForm();
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {editingTx ? (
                        <FormattedMessage id="transactions.edit" />
                    ) : (
                        <FormattedMessage id="transactions.new" />
                    )}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <FormControl
                            fullWidth
                            size="small"
                            disabled={!!editingTx}
                        >
                            <InputLabel>
                                <FormattedMessage id="transactions.type" />
                            </InputLabel>
                            <Select
                                value={form.type}
                                label={intl.formatMessage({
                                    id: "transactions.type",
                                })}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        type: e.target.value as TxType,
                                        category_id: "",
                                    })
                                }
                            >
                                <MenuItem value="income">
                                    <FormattedMessage id="transactions.typeIncome" />
                                </MenuItem>
                                <MenuItem value="expense">
                                    <FormattedMessage id="transactions.typeExpense" />
                                </MenuItem>
                                <MenuItem value="transfer">
                                    <FormattedMessage id="transactions.typeTransfer" />
                                </MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label={intl.formatMessage({
                                id: "transactions.amount",
                            })}
                            type="number"
                            value={form.amount}
                            onChange={(e) => {
                                setForm({ ...form, amount: e.target.value });
                                if (errors.amount)
                                    setErrors({ ...errors, amount: undefined });
                            }}
                            error={!!errors.amount}
                            helperText={errors.amount}
                        />

                        <TextField
                            label={intl.formatMessage({
                                id: "transactions.date",
                            })}
                            type="datetime-local"
                            value={form.date}
                            onChange={(e) => {
                                setForm({ ...form, date: e.target.value });
                                if (errors.date)
                                    setErrors({ ...errors, date: undefined });
                            }}
                            error={!!errors.date}
                            helperText={errors.date}
                            slotProps={{
                                inputLabel: { shrink: true },
                            }}
                        />

                        <FormControl
                            fullWidth
                            size="small"
                            error={!!errors.wallet_id}
                            disabled={!!editingTx}
                        >
                            <InputLabel>
                                <FormattedMessage id="transactions.wallet" />
                            </InputLabel>
                            <Select
                                value={form.wallet_id}
                                label={intl.formatMessage({
                                    id: "transactions.wallet",
                                })}
                                onChange={(e) => {
                                    setForm({
                                        ...form,
                                        wallet_id: e.target.value,
                                    });
                                    if (errors.wallet_id)
                                        setErrors({
                                            ...errors,
                                            wallet_id: undefined,
                                        });
                                }}
                            >
                                {wallets?.map((w) => (
                                    <MenuItem key={w.id} value={w.id}>
                                        {w.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.wallet_id && (
                                <FormHelperText>
                                    {errors.wallet_id}
                                </FormHelperText>
                            )}
                        </FormControl>

                        {form.type === "transfer" && (
                            <FormControl
                                fullWidth
                                size="small"
                                error={!!errors.to_wallet_id}
                                disabled={!!editingTx}
                            >
                                <InputLabel>
                                    <FormattedMessage id="transactions.toWallet" />
                                </InputLabel>
                                <Select
                                    value={form.to_wallet_id}
                                    label={intl.formatMessage({
                                        id: "transactions.toWallet",
                                    })}
                                    onChange={(e) => {
                                        setForm({
                                            ...form,
                                            to_wallet_id: e.target.value,
                                        });
                                        if (errors.to_wallet_id)
                                            setErrors({
                                                ...errors,
                                                to_wallet_id: undefined,
                                            });
                                    }}
                                >
                                    {wallets
                                        ?.filter((w) => w.id !== form.wallet_id)
                                        .map((w) => (
                                            <MenuItem key={w.id} value={w.id}>
                                                {w.name}
                                            </MenuItem>
                                        ))}
                                </Select>
                                {errors.to_wallet_id && (
                                    <FormHelperText>
                                        {errors.to_wallet_id}
                                    </FormHelperText>
                                )}
                            </FormControl>
                        )}

                        {form.type !== "transfer" && (
                            <FormControl
                                fullWidth
                                size="small"
                                error={!!errors.category_id}
                            >
                                <InputLabel>
                                    <FormattedMessage id="transactions.category" />
                                </InputLabel>
                                <Select
                                    value={form.category_id}
                                    label={intl.formatMessage({
                                        id: "transactions.category",
                                    })}
                                    onChange={(e) => {
                                        setForm({
                                            ...form,
                                            category_id: e.target.value,
                                        });
                                        if (errors.category_id)
                                            setErrors({
                                                ...errors,
                                                category_id: undefined,
                                            });
                                    }}
                                >
                                    {flattenCategories(categories).map(
                                        (cat) => (
                                            <MenuItem
                                                key={cat.id}
                                                value={cat.id}
                                                sx={{
                                                    pl: `${16 + cat.depth * 32}px`,
                                                }}
                                            >
                                                {cat.icon && (
                                                    <span
                                                        style={{
                                                            marginRight: 8,
                                                        }}
                                                    >
                                                        {cat.icon}
                                                    </span>
                                                )}
                                                {cat.name}
                                            </MenuItem>
                                        ),
                                    )}
                                </Select>
                                {errors.category_id && (
                                    <FormHelperText>
                                        {errors.category_id}
                                    </FormHelperText>
                                )}
                            </FormControl>
                        )}

                        <TextField
                            label={intl.formatMessage({
                                id: "transactions.note",
                            })}
                            value={form.note}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    note: e.target.value,
                                })
                            }
                            multiline
                            rows={2}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setDialogOpen(false);
                            resetForm();
                        }}
                    >
                        <FormattedMessage id="common.cancel" />
                    </Button>
                    <Button variant="contained" onClick={handleSubmit}>
                        {editingTx ? (
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
