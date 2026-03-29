import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
    palette: {
        mode: "light",
    },
    typography: {
        fontFamily: '"Inter", "Roboto", sans-serif',
        h4: { fontWeight: 700 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundImage: "none",
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 8,
                    padding: "8px 20px",
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                size: "small",
                fullWidth: true,
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    border: "none",
                    backgroundImage: "none",
                },
            },
        },
    },
});
