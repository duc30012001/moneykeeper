import {
    PieChartOutlined as BudgetIcon,
    CategoryOutlined as CategoryIcon,
    DashboardOutlined as DashboardIcon,
    LogoutOutlined as LogoutIcon,
    Menu as MenuIcon,
    PeopleOutlined as PeopleIcon,
    SwapHorizOutlined as TransactionIcon,
    AccountBalanceWalletOutlined as WalletIcon,
} from "@mui/icons-material";
import {
    AppBar,
    Avatar,
    Box,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Toolbar,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";

const DRAWER_WIDTH = 260;

const navItems = [
    {
        labelId: "nav.dashboard",
        icon: <DashboardIcon />,
        path: "/",
    },
    {
        labelId: "nav.wallets",
        icon: <WalletIcon />,
        path: "/wallets",
    },
    {
        labelId: "nav.transactions",
        icon: <TransactionIcon />,
        path: "/transactions",
    },
    {
        labelId: "nav.categories",
        icon: <CategoryIcon />,
        path: "/categories",
    },
    {
        labelId: "nav.budgets",
        icon: <BudgetIcon />,
        path: "/budgets",
    },
];

const adminItems = [
    {
        labelId: "nav.users",
        icon: <PeopleIcon />,
        path: "/admin/users",
    },
];

export default function MainLayout() {
    const theme = useTheme();
    const intl = useIntl();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { profile, logout } = useAuthStore();

    const handleLogout = async () => {
        setAnchorEl(null);
        await logout();
        navigate("/login");
    };

    const drawerContent = (
        <Box
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                bgcolor: "background.paper",
                borderRight: "1px solid rgba(15, 23, 42, 0.08)",
            }}
        >
            <Box
                sx={{
                    px: 3,
                    py: 2.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                }}
            >
                <Box
                    component="img"
                    src="/images/icon.png"
                    alt="MoneyKeeper"
                    sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "10px",
                    }}
                />
                <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, letterSpacing: "-0.5px" }}
                >
                    <FormattedMessage id="app.name" />
                </Typography>
            </Box>

            <Divider sx={{ opacity: 0.06 }} />

            <List sx={{ px: 1.5, py: 1, flex: 1 }}>
                {navItems.map((item) => (
                    <ListItemButton
                        key={item.path}
                        selected={location.pathname === item.path}
                        onClick={() => {
                            navigate(item.path);
                            if (isMobile) setMobileOpen(false);
                        }}
                        sx={{
                            borderRadius: 2,
                            mb: 0.5,
                            "&.Mui-selected": {
                                "& .MuiListItemIcon-root": {
                                    color: "primary.main",
                                },
                                "& .MuiListItemText-primary": {
                                    color: "primary.main",
                                    fontWeight: 600,
                                },
                            },
                        }}
                    >
                        <ListItemIcon
                            sx={{ minWidth: 40, color: "text.secondary" }}
                        >
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText
                            primary={intl.formatMessage({ id: item.labelId })}
                            primaryTypographyProps={{ fontSize: 14 }}
                        />
                    </ListItemButton>
                ))}

                {profile?.role === "admin" && (
                    <>
                        <Divider sx={{ my: 1.5, opacity: 0.06 }} />
                        <Typography
                            variant="caption"
                            sx={{
                                px: 2,
                                py: 1,
                                color: "text.secondary",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: 1,
                            }}
                        >
                            <FormattedMessage id="nav.admin" />
                        </Typography>
                        {adminItems.map((item) => (
                            <ListItemButton
                                key={item.path}
                                selected={location.pathname === item.path}
                                onClick={() => {
                                    navigate(item.path);
                                    if (isMobile) setMobileOpen(false);
                                }}
                                sx={{
                                    borderRadius: 2,
                                    mb: 0.5,
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 40,
                                        color: "text.secondary",
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={intl.formatMessage({
                                        id: item.labelId,
                                    })}
                                    primaryTypographyProps={{ fontSize: 14 }}
                                />
                            </ListItemButton>
                        ))}
                    </>
                )}
            </List>
        </Box>
    );

    return (
        <Box
            sx={{
                display: "flex",
                minHeight: "100vh",
                bgcolor: "background.default",
            }}
        >
            {isMobile ? (
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        "& .MuiDrawer-paper": { width: DRAWER_WIDTH },
                    }}
                >
                    {drawerContent}
                </Drawer>
            ) : (
                <Drawer
                    variant="permanent"
                    sx={{
                        width: DRAWER_WIDTH,
                        flexShrink: 0,
                        "& .MuiDrawer-paper": { width: DRAWER_WIDTH },
                    }}
                >
                    {drawerContent}
                </Drawer>
            )}

            <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <AppBar
                    position="sticky"
                    elevation={0}
                    sx={{
                        bgcolor: "white",
                        backdropFilter: "blur(20px)",
                        borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
                        color: "text.primary",
                    }}
                >
                    <Toolbar>
                        {isMobile && (
                            <IconButton
                                color="inherit"
                                edge="start"
                                onClick={() => setMobileOpen(true)}
                                sx={{ mr: 2 }}
                            >
                                <MenuIcon />
                            </IconButton>
                        )}
                        <Box sx={{ flex: 1 }} />
                        <IconButton
                            onClick={(e) => setAnchorEl(e.currentTarget)}
                        >
                            <Avatar
                                src={profile?.avatar_url || undefined}
                                sx={{
                                    width: 34,
                                    height: 34,
                                    bgcolor: "grey.500",
                                    fontSize: 14,
                                }}
                            >
                                {profile?.display_name?.[0] ||
                                    profile?.email?.[0] ||
                                    "U"}
                            </Avatar>
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={!!anchorEl}
                            onClose={() => setAnchorEl(null)}
                            transformOrigin={{
                                horizontal: "right",
                                vertical: "top",
                            }}
                            anchorOrigin={{
                                horizontal: "right",
                                vertical: "bottom",
                            }}
                        >
                            <MenuItem disabled>
                                <Typography variant="body2">
                                    {profile?.email}
                                </Typography>
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={handleLogout}>
                                <ListItemIcon>
                                    <LogoutIcon fontSize="small" />
                                </ListItemIcon>
                                <FormattedMessage id="nav.logout" />
                            </MenuItem>
                        </Menu>
                    </Toolbar>
                </AppBar>

                <Box sx={{ flex: 1, p: 3, overflow: "auto" }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
}
