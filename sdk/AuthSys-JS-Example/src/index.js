const axios = require('axios');
const os = require('os');
const { execSync } = require('child_process');

class AuthSys {
    constructor(name, ownerid, secret, version, apiUrl = "https://authsys-main-production.up.railway.app/api/v1") {
        this.name = name;
        this.ownerid = ownerid;
        this.secret = secret;
        this.version = version;
        this.apiUrl = apiUrl.replace(/\/$/, "");

        this.sessionToken = null;
        this.initialized = false;
        this.appData = {};
        this.userData = {};
        this.lastResponse = {};
        this.lastError = "";
        this.heartbeatInterval = null;
    }

    getHwid() {
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

    async _post(endpoint, data = null, headers = {}) {
        try {
            const config = {
                headers: { 'Content-Type': 'application/json', ...headers },
                timeout: 30000
            };
            const response = await axios.post(`${this.apiUrl}/client/${endpoint}`, data, config);
            this.lastResponse = response.data;
            return this.lastResponse;
        } catch (error) {
            if (error.response && error.response.data) {
                this.lastResponse = error.response.data;
                return this.lastResponse;
            }
            this.lastResponse = { success: false, detail: `Connection error: ${error.message}` };
            return this.lastResponse;
        }
    }

    async init() {
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

    async register(username, password, licenseKey, email = null) {
        this.lastError = "";
        this.lastResponse = {};
        if (!this.initialized) {
            this.lastError = "init() failed or not called";
            return { success: false, detail: this.lastError };
        }

        const data = {
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

    async login(username, password, sessionLength = 86400) {
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

    async licenseLogin(licenseKey, sessionLength = 86400) {
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

    async licenseCheck(licenseKey) {
        this.lastError = "";
        this.lastResponse = {};
        const data = { app_secret: this.secret, license_key: licenseKey };
        const res = await this._post("license/check", data);
        if (res.detail) this.lastError = res.detail;
        return res;
    }

    async verify() {
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
        const res = await this._post("verify", null, headers);

        if (res.detail) {
            this.lastError = res.detail;
        } else if (!res.valid) {
            this.lastError = "Session verification failed";
        }
        return res;
    }

    async chatSend(roomId, message) {
        this.lastError = "";
        this.lastResponse = {};
        if (!this.sessionToken) {
            this.lastError = "No active session. Login first.";
            return { success: false, detail: this.lastError };
        }

        const headers = { 'Authorization': `Bearer ${this.sessionToken}` };
        const res = await this._post(`chat/send?room_id=${roomId}&message=${encodeURIComponent(message)}`, null, headers);
        if (res.detail) this.lastError = res.detail;
        return res;
    }

    var(varName) {
        if (!this.initialized || !this.appData.variables) return null;
        return this.appData.variables[varName];
    }

    logout() {
        this.sessionToken = null;
        this.userData = {};
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    startHeartbeat(intervalMs = 60000) {
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

module.exports = AuthSys;
