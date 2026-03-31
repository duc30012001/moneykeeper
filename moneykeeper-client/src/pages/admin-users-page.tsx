import {
    Avatar,
    Box,
    Card,
    CardContent,
    Chip,
    Stack,
    Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { FormattedMessage, useIntl } from "react-intl";
import { useUsers } from "../hooks/use-users";

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

export default function AdminUsersPage() {
    const intl = useIntl();
    const { data: users, isLoading } = useUsers();

    const columns: GridColDef[] = [
        {
            field: "user",
            headerName: intl.formatMessage({ id: "users.user" }),
            flex: 1.5,
            minWidth: 250,
            sortable: false,
            renderCell: (params) => (
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                        src={params.row.avatar_url || undefined}
                        sx={{
                            width: 36,
                            height: 36,
                            bgcolor: "grey.400",
                            fontSize: 14,
                        }}
                    >
                        {params.row.display_name?.[0] ||
                            params.row.email?.[0] ||
                            "U"}
                    </Avatar>
                    <Typography variant="body2" fontWeight={600}>
                        {params.row.display_name || "—"}
                    </Typography>
                </Stack>
            ),
        },
        {
            field: "email",
            headerName: intl.formatMessage({ id: "users.email" }),
            flex: 1,
            minWidth: 200,
        },
        {
            field: "role",
            headerName: intl.formatMessage({ id: "users.role" }),
            width: 120,
            headerAlign: "center",
            align: "center",
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    size="small"
                    color={params.value === "admin" ? "warning" : "default"}
                    sx={{ textTransform: "capitalize", fontWeight: 600 }}
                />
            ),
        },
        {
            field: "created_at",
            headerName: intl.formatMessage({ id: "users.joined" }),
            width: 140,
            headerAlign: "center",
            align: "center",
            valueFormatter: (value: string) => formatDate(value),
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
                    <FormattedMessage id="users.title" />
                </Typography>
                {users && (
                    <Chip
                        label={`${users.length} ${intl.formatMessage({ id: "users.user" }).toLowerCase()}`}
                        variant="outlined"
                        size="small"
                    />
                )}
            </Stack>

            <Card>
                <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                    <DataGrid
                        rows={users ?? []}
                        columns={columns}
                        loading={isLoading}
                        autoHeight
                        rowHeight={64}
                        pageSizeOptions={[10, 25, 50]}
                        initialState={{
                            pagination: {
                                paginationModel: { pageSize: 10 },
                            },
                            sorting: {
                                sortModel: [
                                    { field: "created_at", sort: "desc" },
                                ],
                            },
                        }}
                        disableRowSelectionOnClick
                        sx={{
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
                                id: "users.empty",
                            }),
                        }}
                    />
                </CardContent>
            </Card>
        </Box>
    );
}
