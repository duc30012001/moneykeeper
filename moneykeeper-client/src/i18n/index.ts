import en from "./en.json";
import vi from "./vi.json";

export const messages: Record<string, Record<string, string>> = {
    en,
    vi,
};

export const defaultLocale = "vi";

export function getLocale(): string {
    return localStorage.getItem("locale") || defaultLocale;
}

export function setLocale(locale: string) {
    localStorage.setItem("locale", locale);
    window.location.reload();
}
