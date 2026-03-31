import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    ExpandLess,
    ExpandMore,
    FolderOpen as FolderIcon,
    Label as LabelIcon,
} from "@mui/icons-material";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import type { Category } from "../hooks/use-categories";
import {
    useCategories,
    useCreateCategory,
    useDeleteCategory,
    useUpdateCategory,
} from "../hooks/use-categories";

type CatType = "income" | "expense";

function CategoryNode({
    category,
    depth,
    onEdit,
    onDelete,
}: {
    category: Category;
    depth: number;
    onEdit: (cat: Category) => void;
    onDelete: (id: string) => void;
}) {
    const [open, setOpen] = useState(true);
    const hasChildren = category.children?.length > 0;

    return (
        <>
            <ListItemButton sx={{ pl: 2 + depth * 3, borderRadius: 1 }}>
                <ListItemIcon sx={{ minWidth: 36, ...(category.icon && { color: 'unset' }) }}>
                    {category.icon ? (
                        <span style={{ fontSize: 20, lineHeight: 1 }}>{category.icon}</span>
                    ) : hasChildren ? (
                        <FolderIcon fontSize="small" />
                    ) : (
                        <LabelIcon fontSize="small" />
                    )}
                </ListItemIcon>
                <ListItemText
                    primary={category.name}
                    primaryTypographyProps={{ fontSize: 14 }}
                />
                {category.is_default && (
                    <Chip
                        label={<FormattedMessage id="categories.default" />}
                        size="small"
                        sx={{ mr: 1, fontSize: 11, height: 22 }}
                    />
                )}
                {!category.is_default && (
                    <Stack direction="row" spacing={0.5}>
                        <IconButton
                            size="small"
                            onClick={() => onEdit(category)}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDelete(category.id)}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                )}
                {hasChildren && (
                    <IconButton size="small" onClick={() => setOpen(!open)}>
                        {open ? (
                            <ExpandLess fontSize="small" />
                        ) : (
                            <ExpandMore fontSize="small" />
                        )}
                    </IconButton>
                )}
            </ListItemButton>
            {hasChildren && (
                <Collapse in={open}>
                    <List disablePadding>
                        {category.children.map((child) => (
                            <CategoryNode
                                key={child.id}
                                category={child}
                                depth={depth + 1}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))}
                    </List>
                </Collapse>
            )}
        </>
    );
}

export default function CategoriesPage() {
    const intl = useIntl();
    const [activeTab, setActiveTab] = useState<CatType>("expense");
    const { data: categories } = useCategories(activeTab);
    const createCategory = useCreateCategory();
    const updateCategory = useUpdateCategory();
    const deleteCategory = useDeleteCategory();

    const [dialog, setDialog] = useState<{
        open: boolean;
        category?: Category;
    }>({ open: false });
    const [form, setForm] = useState({ name: "", icon: "", parent_id: "" });
    const [errors, setErrors] = useState<{ name?: string }>({});

    const openCreate = () => {
        setForm({ name: "", icon: "", parent_id: "" });
        setErrors({});
        setDialog({ open: true });
    };
    const openEdit = (cat: Category) => {
        setForm({
            name: cat.name,
            icon: cat.icon || "",
            parent_id: cat.parent_id || "",
        });
        setErrors({});
        setDialog({ open: true, category: cat });
    };

    const validate = (): boolean => {
        const newErrors: { name?: string } = {};
        if (!form.name.trim()) {
            newErrors.name = intl.formatMessage({ id: "categories.errorName" });
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        if (dialog.category) {
            await updateCategory.mutateAsync({
                id: dialog.category.id,
                name: form.name,
                icon: form.icon || undefined,
                parent_id: form.parent_id || undefined,
            });
        } else {
            await createCategory.mutateAsync({
                name: form.name,
                type: activeTab,
                icon: form.icon || undefined,
                parent_id: form.parent_id || undefined,
            });
        }
        setDialog({ open: false });
    };

    const handleDelete = async (id: string) => {
        if (confirm(intl.formatMessage({ id: "categories.deleteConfirm" }))) {
            await deleteCategory.mutateAsync(id);
        }
    };

    const flatList = (
        cats: Category[] | undefined,
        depth = 0,
    ): { id: string; name: string; depth: number }[] => {
        if (!cats) return [];
        return cats.flatMap((c) => [
            { id: c.id, name: c.name, depth },
            ...flatList(c.children, depth + 1),
        ]);
    };

    return (
        <Box>
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 3 }}
            >
                <Typography variant="h4">
                    <FormattedMessage id="categories.title" />
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={openCreate}
                >
                    <FormattedMessage id="categories.new" />
                </Button>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                {(["expense", "income"] as const).map((type) => (
                    <Chip
                        key={type}
                        label={type}
                        onClick={() => setActiveTab(type)}
                        sx={{
                            textTransform: "capitalize",
                            ...(activeTab === type && {
                                bgcolor:
                                    type === "income"
                                        ? "success.main"
                                        : "error.main",
                                color: "#ffffff",
                            }),
                        }}
                    />
                ))}
            </Stack>
            <Card>
                <CardContent sx={{ p: 1 }}>
                    <List disablePadding>
                        {categories?.map((cat) => (
                            <CategoryNode
                                key={cat.id}
                                category={cat}
                                depth={0}
                                onEdit={openEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                        {(!categories || categories.length === 0) && (
                            <Box sx={{ textAlign: "center", py: 4 }}>
                                <Typography color="text.secondary">
                                    <FormattedMessage id="categories.empty" />
                                </Typography>
                            </Box>
                        )}
                    </List>
                </CardContent>
            </Card>
            <Dialog
                open={dialog.open}
                onClose={() => setDialog({ open: false })}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>
                    {dialog.category ? (
                        <FormattedMessage id="categories.edit" />
                    ) : (
                        <FormattedMessage id="categories.new" />
                    )}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            autoFocus
                            label={intl.formatMessage({
                                id: "categories.nameLabel",
                            })}
                            value={form.name}
                            onChange={(e) => {
                                setForm({ ...form, name: e.target.value });
                                if (errors.name) setErrors({ ...errors, name: undefined });
                            }}
                            error={!!errors.name}
                            helperText={errors.name}
                        />
                        <TextField
                            label={intl.formatMessage({
                                id: "categories.iconLabel",
                            })}
                            value={form.icon}
                            onChange={(e) =>
                                setForm({ ...form, icon: e.target.value })
                            }
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel>
                                <FormattedMessage id="categories.parentLabel" />
                            </InputLabel>
                            <Select
                                value={form.parent_id}
                                label={intl.formatMessage({
                                    id: "categories.parentLabel",
                                })}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        parent_id: e.target.value,
                                    })
                                }
                            >
                                <MenuItem value="">
                                    <FormattedMessage id="categories.noneRoot" />
                                </MenuItem>
                                {flatList(categories).map((cat) => (
                                    <MenuItem
                                        key={cat.id}
                                        value={cat.id}
                                        sx={{ pl: 2 + cat.depth * 2 }}
                                    >
                                        {cat.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialog({ open: false })}>
                        <FormattedMessage id="common.cancel" />
                    </Button>
                    <Button variant="contained" onClick={handleSubmit}>
                        {dialog.category ? (
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
