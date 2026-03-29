import { Google as GoogleIcon } from "@mui/icons-material";
import {
    Box,
    Button,
    Card,
    CardContent,
    Stack,
    Typography,
} from "@mui/material";
import { useEffect } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";

export default function LoginPage() {
    const { firebaseUser, loginWithGoogle, loading } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && firebaseUser) navigate("/");
    }, [firebaseUser, loading, navigate]);

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "background.default",
                position: "relative",
                overflow: "hidden",
            }}
        >

            <Card
                sx={{
                    maxWidth: 420,
                    width: "100%",
                    mx: 2,
                    bgcolor: "background.paper",
                }}
            >
                <CardContent sx={{ p: 5, textAlign: "center" }}>
                    <Stack spacing={3} alignItems="center">
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: "16px",
                                bgcolor: "primary.main",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 900,
                                fontSize: 28,
                                color: "primary.contrastText",
                            }}
                        >
                            M
                        </Box>

                        <Box>
                            <Typography variant="h4" gutterBottom>
                                <FormattedMessage id="app.name" />
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <FormattedMessage id="app.tagline" />
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<GoogleIcon />}
                            onClick={loginWithGoogle}
                            fullWidth
                            sx={{
                                py: 1.5,
                                mt: 2,
                            }}
                        >
                            <FormattedMessage id="login.signInWithGoogle" />
                        </Button>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
}
