import { ref } from 'vue';

export function useAuthSys() {
    const initialized = ref(false);
    const user = ref<any | null>(null);
    const sessionid = ref<string | null>(null);
    const error = ref<string | null>(null);

    const secret = "your_app_secret";
    const apiUrl = "https://authsys-main-production.up.railway.app/api/v1";
    const getHwid = () => "browser-fingerprint-placeholder";

    const init = async () => {
        try {
            const res = await fetch(`${apiUrl}/client/init`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ app_secret: secret, version: "1.0", hwid: getHwid() })
            });
            const data = await res.json();
            if (data.status === "success") {
                initialized.value = true;
            } else {
                error.value = data.detail;
            }
        } catch (e: any) {
            error.value = e.message;
        }
    };

    const login = async (username: string, password: string) => {
        if (!initialized.value) return false;
        try {
            const res = await fetch(`${apiUrl}/client/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ app_secret: secret, username, password, hwid: getHwid() })
            });
            const data = await res.json();
            if (data.access_token) {
                sessionid.value = data.access_token;
                user.value = data.user;
                return true;
            } else {
                error.value = data.detail;
                return false;
            }
        } catch (e: any) {
            error.value = e.message;
            return false;
        }
    };

    const logout = () => {
        sessionid.value = null;
        user.value = null;
    };

    return { initialized, user, sessionid, error, init, login, logout };
}
