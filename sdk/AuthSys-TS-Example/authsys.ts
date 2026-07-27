/**
 * AuthSys TypeScript SDK
 *
 * Professional authentication SDK for TypeScript/Node.js applications.
 */

import axios, { AxiosResponse } from 'axios';
import * as https from 'https';
import * as os from 'os';
import * as fs from 'fs';
import { execSync } from 'child_process';
import * as crypto from 'crypto';

export interface AuthSysOptions {
    appSecret: string;
    appName?: string;
    version?: string;
    apiUrl?: string;
    timeout?: number;
    maxRetries?: number;
    skipCertificateValidation?: boolean;
    enableLogging?: boolean;
}

export interface InitResult {
    status: string;
    current_version: string;
    message: string;
    variables?: Record<string, any>;
}

export interface LoginResult {
    success: boolean;
    token: string;
    username: string;
    email?: string;
    expires_at?: string;
    variables?: Record<string, any>;
    rank?: string;
}

export interface LicenseCheckResult {
    valid: boolean;
    duration_days?: number;
    key_type?: string;
    message?: string;
}

export interface VerifyResult {
    valid: boolean;
    username: string;
    expires_at?: string;
    variables?: Record<string, any>;
}

export interface RegisterResult {
    success: boolean;
    message: string;
    expires_at?: string;
}

export interface ChatResult {
    success: boolean;
    status: string;
}

export interface DeviceRegisterResult {
    active: boolean;
    device_id: number;
}

export interface DeviceCheckResult {
    active: boolean;
    message: string;
}

export class AuthSysException extends Error {
    public statusCode: number;
    public errorCode: string;

    constructor(message: string, statusCode: number = 0, errorCode: string = '') {
        super(message);
        this.name = 'AuthSysException';
        this.statusCode = statusCode;
        this.errorCode = errorCode;
    }
}

export class AuthSys {
    private _options: Required<Omit<AuthSysOptions, 'appName' | 'version' | 'apiUrl'>> & AuthSysOptions;
    private _sessionToken: string = '';
    private _initialized: boolean = false;
    private _appVariables: Record<string, any> = {};
    private _username: string = '';
    private _heartbeatInterval: NodeJS.Timeout | null = null;

    constructor(options: AuthSysOptions) {
        this._options = {
            appSecret: options.appSecret,
            appName: options.appName || '',
            version: options.version || '',
            apiUrl: (options.apiUrl || 'https://api.authsys.dpdns.org/api/v1').replace(/\/$/, ''),
            timeout: options.timeout || 30000,
            maxRetries: options.maxRetries || 3,
            skipCertificateValidation: options.skipCertificateValidation || false,
            enableLogging: options.enableLogging || false,
        };
    }

    private _log(message: string): void {
        if (this._options.enableLogging) {
            console.log(`[AuthSys] ${message}`);
        }
    }

    private async _sendRequest(
        endpoint: string,
        data: any = null,
        headers: Record<string, string> = {}
    ): Promise<any> {
        const url = `${this._options.apiUrl}/client/${endpoint}`;
        const reqHeaders = { 'Content-Type': 'application/json', ...headers };

        let lastError: string | null = null;
        for (let attempt = 0; attempt <= this._options.maxRetries; attempt++) {
            try {
                this._log(`POST ${url} (attempt ${attempt + 1})`);
                const config: any = {
                    headers: reqHeaders,
                    timeout: this._options.timeout,
                };

                if (this._options.skipCertificateValidation) {
                    config.httpsAgent = new https.Agent({ rejectUnauthorized: false });
                }

                const response: AxiosResponse = await axios.post(url, data, config);
                this._log(`Response: ${response.status} - ${JSON.stringify(response.data)}`);
                return response.data;
            } catch (error: any) {
                if (error.response) {
                    this._handleError(error.response);
                }
                lastError = error.message;
                this._log(`Request error (attempt ${attempt + 1}): ${lastError}`);
                if (attempt < this._options.maxRetries) {
                    await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
                }
            }
        }

        throw new AuthSysException(lastError || 'Request failed after all retries', 0, 'network_error');
    }

    private _handleError(response: AxiosResponse): never {
        let detail: string = response.data;
        if (typeof response.data === 'object' && response.data !== null && response.data.detail) {
            detail = response.data.detail;
        }

        const errorMap: Record<number, string> = {
            401: 'unauthorized',
            403: 'forbidden',
            404: 'not_found',
            429: 'rate_limited',
            503: 'maintenance',
        };
        const errorCode = errorMap[response.status] || 'api_error';
        throw new AuthSysException(detail, response.status, errorCode);
    }

    async init(): Promise<InitResult> {
        this._log('Initializing...');
        const data = {
            app_secret: this._options.appSecret,
            version: this._options.version,
            app_name: this._options.appName,
            hwid: getHwid(),
        };

        const result = await this._sendRequest('init', data);
        const status = result.status || '';

        if (status === 'update_required') {
            throw new AuthSysException(result.message || 'Update required', 0, 'version_mismatch');
        }

        this._initialized = status === 'success' || status === 'update_available';
        this._appVariables = result.variables || {};
        return result as InitResult;
    }

    async register(username: string, password: string, licenseKey: string, email: string = ''): Promise<RegisterResult> {
        if (!this._initialized) {
            throw new AuthSysException('Not initialized. Call init() first.', 0, 'not_initialized');
        }

        const data: any = {
            app_secret: this._options.appSecret,
            username,
            password,
            license_key: licenseKey,
            hwid: getHwid(),
        };
        if (email) data.email = email;

        return await this._sendRequest('register', data) as RegisterResult;
    }

    async login(username: string, password: string, sessionLength: number = 86400): Promise<LoginResult> {
        if (!this._initialized) {
            throw new AuthSysException('Not initialized. Call init() first.', 0, 'not_initialized');
        }

        this._sessionToken = '';
        const data = {
            app_secret: this._options.appSecret,
            username,
            password,
            hwid: getHwid(),
            session_length: sessionLength,
        };

        const result = await this._sendRequest('login', data) as LoginResult;
        if (result.success && result.token) {
            this._sessionToken = result.token;
            this._username = result.username || username;
        }
        return result;
    }

    async licenseLogin(licenseKey: string, sessionLength: number = 86400): Promise<LoginResult> {
        if (!this._initialized) {
            throw new AuthSysException('Not initialized. Call init() first.', 0, 'not_initialized');
        }

        this._sessionToken = '';
        const data = {
            app_secret: this._options.appSecret,
            license_key: licenseKey,
            hwid: getHwid(),
            session_length: sessionLength,
        };

        const result = await this._sendRequest('license-login', data) as LoginResult;
        if (result.success && result.token) {
            this._sessionToken = result.token;
            this._username = result.username || '';
        }
        return result;
    }

    async licenseCheck(licenseKey: string): Promise<LicenseCheckResult> {
        const data = {
            app_secret: this._options.appSecret,
            license_key: licenseKey,
        };
        return await this._sendRequest('license/check', data) as LicenseCheckResult;
    }

    async verify(): Promise<VerifyResult> {
        if (!this._sessionToken) {
            throw new AuthSysException('No active session. Login first.', 0, 'no_session');
        }

        const headers = {
            'Authorization': `Bearer ${this._sessionToken}`,
            'X-HWID': getHwid(),
        };
        return await this._sendRequest('verify', null, headers) as VerifyResult;
    }

    async sendChatMessage(roomId: number, message: string): Promise<ChatResult> {
        if (!this._sessionToken) {
            throw new AuthSysException('No active session. Login first.', 0, 'no_session');
        }

        const headers = { 'Authorization': `Bearer ${this._sessionToken}` };
        const endpoint = `chat/send?room_id=${roomId}&message=${encodeURIComponent(message)}`;
        return await this._sendRequest(endpoint, null, headers) as ChatResult;
    }

    async registerDevice(hwid: string, deviceName: string = ''): Promise<DeviceRegisterResult> {
        const data: any = {
            app_secret: this._options.appSecret,
            hwid,
        };
        if (deviceName) data.device_name = deviceName;
        return await this._sendRequest('device/register', data) as DeviceRegisterResult;
    }

    async checkDevice(hwid: string): Promise<DeviceCheckResult> {
        const data = {
            app_secret: this._options.appSecret,
            hwid,
        };
        return await this._sendRequest('device/check', data) as DeviceCheckResult;
    }

    getVariable(key: string): any {
        return this._appVariables[key];
    }

    getAllVariables(): Record<string, any> {
        return this._appVariables;
    }

    logout(): void {
        this._sessionToken = '';
        if (this._heartbeatInterval) {
            clearInterval(this._heartbeatInterval);
            this._heartbeatInterval = null;
        }
    }

    startHeartbeat(intervalMs: number = 60000): void {
        if (this._heartbeatInterval) clearInterval(this._heartbeatInterval);
        this._heartbeatInterval = setInterval(async () => {
            if (!this._sessionToken) {
                if (this._heartbeatInterval) clearInterval(this._heartbeatInterval);
                return;
            }
            try {
                const result = await this.verify();
                if (!result.valid) {
                    this._sessionToken = '';
                    if (this._heartbeatInterval) clearInterval(this._heartbeatInterval);
                }
            } catch (e) {
                this._sessionToken = '';
                if (this._heartbeatInterval) clearInterval(this._heartbeatInterval);
            }
        }, intervalMs);
    }

    get isAuthenticated(): boolean {
        return !!this._sessionToken;
    }

    get isInitialized(): boolean {
        return this._initialized;
    }

    get username(): string {
        return this._username;
    }
}

export function getHwid(): string {
    try {
        if (os.platform() === 'win32') {
            const output = execSync('wmic csproduct get uuid', { encoding: 'utf-8' });
            const lines = output.split('\n').filter(l => l.trim());
            if (lines.length > 1) return lines[1].trim();
        } else if (os.platform() === 'linux') {
            if (fs.existsSync('/etc/machine-id')) {
                return fs.readFileSync('/etc/machine-id', 'utf-8').trim();
            }
        } else if (os.platform() === 'darwin') {
            const output = execSync('ioreg -rd1 -c IOPlatformExpertDevice', { encoding: 'utf-8' });
            const parts = output.split('"');
            if (parts.length > 3) return parts[3];
        }
    } catch (e) {}
    return os.hostname();
}

export function hashString(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
}

export function generateGuid(): string {
    return crypto.randomUUID();
}
