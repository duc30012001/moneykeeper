import { ThemeProvider } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { IntlProvider } from "react-intl";
import App from "./app";
import { getLocale, messages } from "./i18n";
import "./index.css";
import { theme } from "./theme";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30_000,
        },
    },
});

const locale = getLocale();

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <IntlProvider
            locale={locale}
            messages={messages[locale]}
            defaultLocale="en"
        >
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <App />
                </ThemeProvider>
            </QueryClientProvider>
        </IntlProvider>
    </React.StrictMode>,
);
