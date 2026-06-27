import axios, { AxiosError } from 'axios';
import * as os from 'os';
import { execSync } from 'child_process';

export interface AuthSysResponse {
    status?: string;
    message?: string;
    detail?: string;
    success?: boolean;
    token?: string;
    valid?: boolean;
    username?: string;
    email?: string;
    expires_at?: string;
    variables?: Record<string, any>;
    user?: Record<string, any>;
}

export interface UserData {
    username: string;
    email: string;
}

export class AuthSys {
    private name: string;
    private ownerid: string;
    private secret: string;
    private version: string;
    private apiUrl: string;

    public sessionToken: string | null = null;
    public initialized: boolean = false;
    public appData: { variables?: Record<string, any> } = {};
    public userData: UserData = { username: "", email: "" };
    public lastResponse: AuthSysResponse = {};
    public lastError: string = "";
    private heartbeatInterval: any = null;

    constructor(
        name: string,
        ownerid: string,
        secret: string,
        version: string,
        apiUrl: string = "https://authsys-main-production.up.railway.app/api/v1"
    ) {
        this.name = name;
        this.ownerid = ownerid;
        this.secret = secret;
        this.version = version;
        this.apiUrl = apiUrl.replace(/\/$/, "");
    }

    private getHwid(): string {
        try {
            if (os.platform() === 'win32') {
                const output = execSync('wmic csproduct get uuid', { encoding: 'utf-8' });
                return output.split('\n')[1].trim();
            } else if (os.platform() === 'linux') {
                const output = execSync('cat /etc/machine-id', { encoding: 'utf-8' });
                return output.trim();
            } else if (os.platform() === 'darwin') {
                const output = execSync('ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID', { encoding: 'utf-8' });
                return output.split('"')[3];
            }
        } catch (e) {}
        return os.hostname();
    }

    private async _post(endpoint: string, data?: any, headers?: Record<string, string>): Promise<AuthSysResponse> {
        try {
            const response = await axios.post(`${this.apiUrl}/client/${endpoint}`, data || null, {
                headers: { 'Content-Type': 'application/json', ...headers },
                timeout: 30000
            });
            this.lastResponse = response.data;
            return this.lastResponse;
        } catch (error) {
            const axiosError = error as AxiosError<AuthSysResponse>;
            if (axiosError.response && axiosError.response.data) {
                this.lastResponse = axiosError.response.data;
                return this.lastResponse;
            }
            this.lastResponse = { success: false, detail: `Connection error: ${axiosError.message}` };
            return this.lastResponse;
        }
    }

    async init(): Promise<AuthSysResponse> {
        this.lastError = "";
        this.lastResponse = {};
        this.initialized = false;

        const data = {
            app_secret: this.secret,
            version: this.version,
            app_name: this.name,
            hwid: this.getHwid()
        };
        const res = await this._post("init", data);

        if (res.status === "success" || res.status === "update_available") {
            this.initialized = true;
            this.appData.variables = res.variables || {};
        } else {
            this.lastError = res.detail || res.message || "Init failed";
        }
        return res;
    }

    async register(username: string, password: string, licenseKey: string, email?: string): Promise<AuthSysResponse> {
        this.lastError = "";
        this.lastResponse = {};
        if (!this.initialized) {
            this.lastError = "init() failed or not called";
            return { success: false, detail: this.lastError };
        }

        const data: any = {
            app_secret: this.secret,
            username,
            password,
            license_key: licenseKey,
            hwid: this.getHwid()
        };
        if (email) data.email = email;

        const res = await this._post("register", data);

        if (res.detail) {
            this.lastError = res.detail;
        } else if (!res.success) {
            this.lastError = "Registration failed";
        }
        return res;
    }

    async login(username: string, password: string, sessionLength: number = 86400): Promise<AuthSysResponse> {
        this.lastError = "";
        this.lastResponse = {};
        this.sessionToken = null;
        if (!this.initialized) {
            this.lastError = "init() failed or not called";
            return { success: false, detail: this.lastError };
        }

        const data = {
            app_secret: this.secret,
            username,
            password,
            hwid: this.getHwid(),
            session_length: sessionLength
        };
        const res = await this._post("login", data);

        if (res.detail) {
            this.lastError = res.detail;
        } else if (res.success && res.token) {
            this.sessionToken = res.token;
            this.userData = { username: res.username || username, email: res.email || "" };
        } else if (!res.success) {
            this.lastError = "Login failed: server returned success=false";
        }
        return res;
    }

    async licenseLogin(licenseKey: string, sessionLength: number = 86400): Promise<AuthSysResponse> {
        this.lastError = "";
        this.lastResponse = {};
        this.sessionToken = null;
        if (!this.initialized) {
            this.lastError = "init() failed or not called";
            return { success: false, detail: this.lastError };
        }

        const data = {
            app_secret: this.secret,
            license_key: licenseKey,
            hwid: this.getHwid(),
            session_length: sessionLength
        };
        const res = await this._post("license-login", data);

        if (res.detail) {
            this.lastError = res.detail;
        } else if (res.success && res.token) {
            this.sessionToken = res.token;
            this.userData = { username: res.username || "", email: "" };
        } else if (!res.success) {
            this.lastError = "License login failed: server returned success=false";
        }
        return res;
    }

    async licenseCheck(licenseKey: string): Promise<AuthSysResponse> {
        this.lastError = "";
        this.lastResponse = {};
        const data = { app_secret: this.secret, license_key: licenseKey };
        const res = await this._post("license/check", data);
        if (res.detail) this.lastError = res.detail;
        return res;
    }

    async verify(): Promise<AuthSysResponse> {
        this.lastError = "";
        this.lastResponse = {};
        if (!this.sessionToken) {
            this.lastError = "No active session. Login first.";
            return { success: false, detail: this.lastError };
        }

        const headers = {
            'Authorization': `Bearer ${this.sessionToken}`,
            'X-HWID': this.getHwid()
        };
        const res = await this._post("verify", undefined, headers);

        if (res.detail) {
            this.lastError = res.detail;
        } else if (!res.valid) {
            this.lastError = "Session verification failed";
        }
        return res;
    }

    async chatSend(roomId: number, message: string): Promise<AuthSysResponse> {
        this.lastError = "";
        this.lastResponse = {};
        if (!this.sessionToken) {
            this.lastError = "No active session. Login first.";
            return { success: false, detail: this.lastError };
        }

        const headers = { 'Authorization': `Bearer ${this.sessionToken}` };
        const res = await this._post(`chat/send?room_id=${roomId}&message=${encodeURIComponent(message)}`, undefined, headers);
        if (res.detail) this.lastError = res.detail;
        return res;
    }

    var(varName: string): any {
        if (!this.initialized || !this.appData.variables) return null;
        return this.appData.variables[varName];
    }

    logout(): void {
        this.sessionToken = null;
        this.userData = { username: "", email: "" };
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    startHeartbeat(intervalMs: number = 60000): void {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(async () => {
            if (!this.sessionToken) {
                clearInterval(this.heartbeatInterval);
                return;
            }
            const result = await this.verify();
            if (!result.valid) {
                this.sessionToken = null;
                clearInterval(this.heartbeatInterval);
            }
        }, intervalMs);
    }
}
