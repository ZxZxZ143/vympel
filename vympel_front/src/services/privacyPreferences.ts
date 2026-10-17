export const PRIVACY_KEY = "vympel:privacy:v1";
const CHANGE_EVENT = "vympel:privacy:change";
export type PrivacyChoice = "essential" | "analytics";
let unavailableStorageChoice: PrivacyChoice | null = null;

export function privacyChoice(): PrivacyChoice | null {
    if (typeof window === "undefined") return null;
    try {
        const value = window.localStorage.getItem(PRIVACY_KEY);
        return value === "essential" || value === "analytics" ? value : null;
    } catch { return unavailableStorageChoice; }
}

export function analyticsAllowed() { return privacyChoice() === "analytics"; }

export function setPrivacyChoice(choice: PrivacyChoice) {
    unavailableStorageChoice = choice;
    try { window.localStorage.setItem(PRIVACY_KEY, choice); } catch { /* Keep this tab's choice when storage is blocked. */ }
    if (choice === "essential") {
        try {
            const keys = Object.keys(window.sessionStorage).filter((key) => key === "vympel_analytics_session_id" || key.startsWith("vympel_product_view_"));
            keys.forEach((key) => window.sessionStorage.removeItem(key));
        } catch { /* Storage may be disabled. */ }
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribePrivacy(listener: () => void) {
    window.addEventListener(CHANGE_EVENT, listener);
    const onStorage = (event: StorageEvent) => { if (event.key === PRIVACY_KEY || event.key === null) listener(); };
    window.addEventListener("storage", onStorage);
    return () => { window.removeEventListener(CHANGE_EVENT, listener); window.removeEventListener("storage", onStorage); };
}
