/**
 * AuthSys JavaScript SDK
 *
 * Professional authentication SDK for Node.js applications.
 */

const axios = require('axios');
const crypto = require('crypto');

class AuthSysException extends Error {
    constructor(message, statusCode = 0, errorCode = '') {
        super(message);
        this.name = 'AuthSysException';
        this.statusCode = statusCode;
        this.errorCode = errorCode;
    }
}

class AuthSys {
    constructor(options = {}) {
        this._options = {
            appSecret: options.appSecret || options.secret || '',
            appName: options.appName || options.name || '',
            version: options.version || '',
            apiUrl: (options.apiUrl || 'https://api.authsys.dpdns.org/api/v1').replace(/\/$/, ''),
            timeout: options.timeout || 30000,
            maxRetries: options.maxRetries || 3,
            skipCertificateValidation: options.skipCertificateValidation || false,
            enableLogging: options.enableLogging || false,
            hwid: options.hwid || '',
        };

        this._sessionToken = '';
        this._initialized = false;
        this._appVariables = {};
        this._username = '';
        this._heartbeatInterval = null;
    }

    _log(message) {
        if (this._options.enableLogging) {
            console.log(`[AuthSys] ${message}`);
        }
    }

    _getHwid() {
        return this._options.hwid || getHwid();
    }

    async _sendRequest(endpoint, data = null, headers = {}) {
        const url = `${this._options.apiUrl}/client/${endpoint}`;
        const reqHeaders = { 'Content-Type': 'application/json', ...headers };

        let lastError = null;
        for (let attempt = 0; attempt <= this._options.maxRetries; attempt++) {
            try {
                this._log(`POST ${url} (attempt ${attempt + 1})`);
                const config = {
                    headers: reqHeaders,
                    timeout: this._options.timeout,
                    httpsAgent: this._options.skipCertificateValidation
                        ? new (require('https').Agent)({ rejectUnauthorized: false })
                        : undefined,
                };

                const response = await axios.post(url, data, config);
                this._log(`Response: ${response.status} - ${JSON.stringify(response.data)}`);
                return response.data;
            } catch (error) {
                if (error.response) {
                    return this._handleError(error.response);
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

    _handleError(response) {
        let detail = response.data;
        if (typeof response.data === 'object' && response.data !== null && response.data.detail) {
            detail = response.data.detail;
        }

        const errorMap = {
            401: 'unauthorized',
            403: 'forbidden',
            404: 'not_found',
            429: 'rate_limited',
            503: 'maintenance',
        };
        const errorCode = errorMap[response.status] || 'api_error';
        throw new AuthSysException(detail, response.status, errorCode);
    }

    async init() {
        this._log('Initializing...');
        const data = {
            app_secret: this._options.appSecret,
            version: this._options.version,
            app_name: this._options.appName,
            hwid: this._getHwid(),
        };

        const result = await this._sendRequest('init', data);
        const status = result.status || '';

        if (status === 'update_required') {
            throw new AuthSysException(result.message || 'Update required', 0, 'version_mismatch');
        }

        this._initialized = status === 'success' || status === 'update_available';
        this._appVariables = result.variables || {};
        return result;
    }

    async register(username, password, licenseKey, email = '') {
        if (!this._initialized) {
            throw new AuthSysException('Not initialized. Call init() first.', 0, 'not_initialized');
        }

        const data = {
            app_secret: this._options.appSecret,
            username,
            password,
            license_key: licenseKey,
            hwid: this._getHwid(),
        };
        if (email) data.email = email;

        return await this._sendRequest('register', data);
    }

    async login(username, password, sessionLength = 86400) {
        if (!this._initialized) {
            throw new AuthSysException('Not initialized. Call init() first.', 0, 'not_initialized');
        }

        this._sessionToken = '';
        const data = {
            app_secret: this._options.appSecret,
            username,
            password,
            hwid: this._getHwid(),
            session_length: sessionLength,
        };

        const result = await this._sendRequest('login', data);
        if (result.success && result.token) {
            this._sessionToken = result.token;
            this._username = result.username || username;
        }
        return result;
    }

    async licenseLogin(licenseKey, sessionLength = 86400) {
        if (!this._initialized) {
            throw new AuthSysException('Not initialized. Call init() first.', 0, 'not_initialized');
        }

        this._sessionToken = '';
        const data = {
            app_secret: this._options.appSecret,
            license_key: licenseKey,
            hwid: this._getHwid(),
            session_length: sessionLength,
        };

        const result = await this._sendRequest('license-login', data);
        if (result.success && result.token) {
            this._sessionToken = result.token;
            this._username = result.username || '';
        }
        return result;
    }

    async licenseCheck(licenseKey) {
        const data = {
            app_secret: this._options.appSecret,
            license_key: licenseKey,
        };
        return await this._sendRequest('license/check', data);
    }

    async verify() {
        if (!this._sessionToken) {
            throw new AuthSysException('No active session. Login first.', 0, 'no_session');
        }

        const headers = {
            'Authorization': `Bearer ${this._sessionToken}`,
            'X-HWID': this._getHwid(),
        };
        return await this._sendRequest('verify', null, headers);
    }

    async sendChatMessage(roomId, message) {
        if (!this._sessionToken) {
            throw new AuthSysException('No active session. Login first.', 0, 'no_session');
        }

        const headers = { 'Authorization': `Bearer ${this._sessionToken}`, 'X-HWID': this._getHwid() };
        const endpoint = `chat/send?room_id=${roomId}&message=${encodeURIComponent(message)}`;
        return await this._sendRequest(endpoint, null, headers);
    }

    async registerDevice(hwid, deviceName = '') {
        const data = {
            app_secret: this._options.appSecret,
            hwid,
        };
        if (deviceName) data.device_name = deviceName;
        return await this._sendRequest('device/register', data);
    }

    async checkDevice(hwid) {
        const data = {
            app_secret: this._options.appSecret,
            hwid,
        };
        return await this._sendRequest('device/check', data);
    }

    getVariable(key) {
        return this._appVariables[key];
    }

    getAllVariables() {
        return this._appVariables;
    }

    logout() {
        this._sessionToken = '';
        if (this._heartbeatInterval) {
            clearInterval(this._heartbeatInterval);
            this._heartbeatInterval = null;
        }
    }

    startHeartbeat(intervalMs = 60000) {
        if (this._heartbeatInterval) clearInterval(this._heartbeatInterval);
        this._heartbeatInterval = setInterval(async () => {
            if (!this._sessionToken) {
                clearInterval(this._heartbeatInterval);
                return;
            }
            try {
                const result = await this.verify();
                if (!result.valid) {
                    this._sessionToken = '';
                    clearInterval(this._heartbeatInterval);
                }
            } catch (e) {
                this._sessionToken = '';
                clearInterval(this._heartbeatInterval);
            }
        }, intervalMs);
    }

    get isAuthenticated() {
        return !!this._sessionToken;
    }

    get isInitialized() {
        return this._initialized;
    }

    get username() {
        return this._username;
    }
}

function getHwid() {
    const os = require('os');
    const { execSync } = require('child_process');

    try {
        if (os.platform() === 'win32') {
            const output = execSync('wmic csproduct get uuid', { encoding: 'utf-8' });
            const lines = output.split('\n').filter(l => l.trim());
            if (lines.length > 1) return lines[1].trim();
        } else if (os.platform() === 'linux') {
            const fs = require('fs');
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

function hashString(input) {
    return crypto.createHash('sha256').update(input).digest('hex');
}

function generateGuid() {
    return crypto.randomUUID();
}

module.exports = { AuthSys, AuthSysException, getHwid, hashString, generateGuid };
