import {
    Add as AddIcon,
    Delete as DeleteIcon,
    DragIndicator as DragIcon,
    Edit as EditIcon,
    AccountBalanceWallet as WalletIcon,
} from "@mui/icons-material";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Snackbar,
    Stack,
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
import type { Wallet } from "../hooks/use-wallets";
import {
    useCreateWallet,
    useDeleteWallet,
    useReorderWallets,
    useUpdateWallet,
    useWallets,
} from "../hooks/use-wallets";

function formatMoney(value: string | number) {
    return Number(value).toLocaleString("vi-VN");
}

function SortableWalletCard({
    wallet,
    onEdit,
    onDelete,
}: {
    wallet: Wallet;
    onEdit: (w: Wallet) => void;
    onDelete: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: wallet.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} ref={setNodeRef} style={style}>
            <Card
                sx={{
                    position: "relative",
                    overflow: "hidden",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                        transform: isDragging ? undefined : "translateY(-4px)",
                        boxShadow: isDragging ? undefined : 12,
                    },
                }}
            >
                <Box
                    sx={{
                        position: "absolute",
                        right: -15,
                        top: -15,
                        opacity: 0.06,
                    }}
                >
                    <WalletIcon sx={{ fontSize: 100 }} />
                </Box>
                <CardContent
                    sx={{ position: "relative", zIndex: 1 }}
                >
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="start"
                    >
                        <Box>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 0.5 }}
                            >
                                {wallet.name}
                            </Typography>
                            <Typography
                                variant="h5"
                                fontWeight={800}
                            >
                                {formatMoney(wallet.balance)}
                            </Typography>
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
                                onClick={() => onEdit(wallet)}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                                size="small"
                                color="error"
                                onClick={() => onDelete(wallet.id)}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        </Grid>
    );
}

export default function WalletsPage() {
    const intl = useIntl();
    const { data: wallets, isLoading } = useWallets();
    const createWallet = useCreateWallet();
    const updateWallet = useUpdateWallet();
    const deleteWallet = useDeleteWallet();
    const reorderWallets = useReorderWallets();
    const [dialog, setDialog] = useState<{ open: boolean; wallet?: Wallet }>({
        open: false,
    });
    const [name, setName] = useState("");
    const [initialBalance, setInitialBalance] = useState("");
    const [errors, setErrors] = useState<{ name?: string }>({});
    const [snackbar, setSnackbar] = useState({ open: false, message: "" });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const openCreate = () => {
        setName("");
        setInitialBalance("");
        setErrors({});
        setDialog({ open: true });
    };

    const openEdit = (wallet: Wallet) => {
        setName(wallet.name);
        setInitialBalance(wallet.initial_balance ? wallet.initial_balance.toString() : "0");
        setErrors({});
        setDialog({ open: true, wallet });
    };

    const validate = (): boolean => {
        const newErrors: { name?: string } = {};
        if (!name.trim()) {
            newErrors.name = intl.formatMessage({ id: "wallets.errorName" });
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        try {
            const initBal = initialBalance ? Number(initialBalance) : 0;
            if (dialog.wallet) {
                await updateWallet.mutateAsync({ id: dialog.wallet.id, name, initial_balance: initBal });
            } else {
                await createWallet.mutateAsync({ name, initial_balance: initBal });
            }
            setDialog({ open: false });
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            setSnackbar({ open: true, message: err?.response?.data?.message || "Error" });
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm(intl.formatMessage({ id: "wallets.deleteConfirm" }))) {
            await deleteWallet.mutateAsync(id);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id || !wallets) return;

        const oldIndex = wallets.findIndex((w) => w.id === active.id);
        const newIndex = wallets.findIndex((w) => w.id === over.id);
        const reordered = arrayMove(wallets, oldIndex, newIndex);

        await reorderWallets.mutateAsync(
            reordered.map((w, i) => ({ id: w.id, sort_order: i })),
        );
    };

    const walletIds = wallets?.map((w) => w.id) ?? [];

    return (
        <Box>
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 3 }}
            >
                <Typography variant="h4">
                    <FormattedMessage id="wallets.title" />
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={openCreate}
                >
                    <FormattedMessage id="wallets.new" />
                </Button>
            </Stack>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={walletIds} strategy={rectSortingStrategy}>
                    <Grid container spacing={3}>
                        {wallets?.map((wallet) => (
                            <SortableWalletCard
                                key={wallet.id}
                                wallet={wallet}
                                onEdit={openEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                        {!isLoading && (!wallets || wallets.length === 0) && (
                            <Grid size={12}>
                                <Card>
                                    <CardContent sx={{ textAlign: "center", py: 6 }}>
                                        <WalletIcon
                                            sx={{
                                                fontSize: 48,
                                                color: "text.secondary",
                                                mb: 2,
                                            }}
                                        />
                                        <Typography color="text.secondary">
                                            <FormattedMessage id="wallets.empty" />
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
                    {dialog.wallet ? (
                        <FormattedMessage id="wallets.edit" />
                    ) : (
                        <FormattedMessage id="wallets.new" />
                    )}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            autoFocus
                            label={intl.formatMessage({
                                id: "wallets.nameLabel",
                            })}
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (errors.name) setErrors({ ...errors, name: undefined });
                            }}
                            error={!!errors.name}
                            helperText={errors.name}
                        />
                        <TextField
                            label={intl.formatMessage({
                                id: "wallets.initialBalanceLabel",
                                defaultMessage: "Initial Balance"
                            })}
                            type="number"
                            value={initialBalance}
                            onChange={(e) => setInitialBalance(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialog({ open: false })}>
                        <FormattedMessage id="common.cancel" />
                    </Button>
                    <Button variant="contained" onClick={handleSubmit}>
                        {dialog.wallet ? (
                            <FormattedMessage id="common.update" />
                        ) : (
                            <FormattedMessage id="common.create" />
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity="error"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
