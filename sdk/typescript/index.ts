import axios, { AxiosError } from 'axios';
import * as os from 'os';
import { execSync } from 'child_process';

export interface AuthSysResponse {
    status?: string;
    message?: string;
    detail?: string;
    access_token?: string;
    variables?: Record<string, any>;
    user?: Record<string, any>;
}

export class AuthSys {
    private name: string;
    private ownerid: string;
    private secret: string;
    private version: string;
    private apiUrl: string;
    
    public sessionid: string | null = null;
    public initialized: boolean = false;
    public appData: { variables?: Record<string, any> } = {};
    public userData: Record<string, any> = {};

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
        let hwid = "UNKNOWN_HWID";
        try {
            if (os.platform() === 'win32') {
                const output = execSync('wmic csproduct get uuid', { encoding: 'utf-8' });
                hwid = output.split('\n')[1].trim();
            } else if (os.platform() === 'linux') {
                const output = execSync('cat /etc/machine-id', { encoding: 'utf-8' });
                hwid = output.trim();
            } else if (os.platform() === 'darwin') {
                const output = execSync('ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID', { encoding: 'utf-8' });
                hwid = output.split('"')[3];
            }
        } catch (e) {
            hwid = os.hostname();
        }
        return hwid;
    }

    private async _post(endpoint: string, data: any): Promise<AuthSysResponse> {
        try {
            const response = await axios.post(`${this.apiUrl}/client/${endpoint}`, data);
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<AuthSysResponse>;
            if (axiosError.response && axiosError.response.data) {
                return axiosError.response.data;
            }
            return { status: "error", detail: axiosError.message };
        }
    }

    public async init(): Promise<AuthSysResponse> {
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
            console.log(`[*] Initialized successfully. Message: ${res.message}`);
        } else {
            console.log(`[!] Init Failed: ${res.detail || res.message || 'Unknown Error'}`);
        }
        
        return res;
    }

    public async register(username: string, password: string, licenseKey: string, email: string | null = null): Promise<boolean> {
        if (!this.initialized) return false;

        const data = {
            app_secret: this.secret,
            username,
            password,
            license_key: licenseKey,
            email,
            hwid: this.getHwid()
        };

        const res = await this._post("register", data);

        if (res.access_token || res.message === "User registered successfully") {
            this.userData = res.user || {};
            return true;
        }
        return false;
    }

    public async login(username: string, password: string): Promise<boolean> {
        if (!this.initialized) return false;

        const data = {
            app_secret: this.secret,
            username,
            password,
            hwid: this.getHwid()
        };

        const res = await this._post("login", data);

        if (res.access_token) {
            this.sessionid = res.access_token;
            this.userData = res.user || {};
            return true;
        }
        return false;
    }

    public async license(licenseKey: string): Promise<boolean> {
        if (!this.initialized) return false;

        const data = {
            app_secret: this.secret,
            license_key: licenseKey,
            hwid: this.getHwid()
        };

        const res = await this._post("license_login", data);

        if (res.access_token) {
            this.sessionid = res.access_token;
            this.userData = res.user || {};
            return true;
        }
        return false;
    }

    public var(varName: string): any {
        if (!this.initialized || !this.appData.variables) return null;
        return this.appData.variables[varName];
    }
}
