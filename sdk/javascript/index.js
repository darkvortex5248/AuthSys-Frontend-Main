const axios = require('axios');
const os = require('os');
const { execSync } = require('child_process');

class AuthSys {
    /**
     * Initialize AuthSys SDK
     * @param {string} name - Application Name
     * @param {string} ownerid - Owner ID
     * @param {string} secret - Application Secret
     * @param {string} version - Version
     * @param {string} apiUrl - Backend API URL
     */
    constructor(name, ownerid, secret, version, apiUrl = "https://authsys-main-production.up.railway.app/api/v1") {
        this.name = name;
        this.ownerid = ownerid;
        this.secret = secret;
        this.version = version;
        this.apiUrl = apiUrl.replace(/\/$/, "");
        
        this.sessionid = null;
        this.initialized = false;
        this.appData = {};
        this.userData = {};
    }

    getHwid() {
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
            // Fallback to mac address or hostname if permissions fail
            hwid = os.hostname();
        }
        return hwid;
    }

    async _post(endpoint, data) {
        try {
            const response = await axios.post(`${this.apiUrl}/client/${endpoint}`, data);
            return response.data;
        } catch (error) {
            if (error.response) {
                return error.response.data;
            }
            return { status: "error", detail: error.message };
        }
    }

    async init() {
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

    async register(username, password, licenseKey, email = null) {
        if (!this.initialized) {
            console.log("[!] Please run init() first.");
            return false;
        }

        const data = {
            app_secret: this.secret,
            username: username,
            password: password,
            license_key: licenseKey,
            email: email,
            hwid: this.getHwid()
        };

        const res = await this._post("register", data);

        if (res.access_token || res.message === "User registered successfully") {
            console.log("[*] Successfully registered!");
            this.userData = res.user || {};
            return true;
        } else {
            console.log(`[!] Registration failed: ${res.detail}`);
            return false;
        }
    }

    async login(username, password) {
        if (!this.initialized) {
            console.log("[!] Please run init() first.");
            return false;
        }

        const data = {
            app_secret: this.secret,
            username: username,
            password: password,
            hwid: this.getHwid()
        };

        const res = await this._post("login", data);

        if (res.access_token) {
            console.log("[*] Successfully logged in!");
            this.sessionid = res.access_token;
            this.userData = res.user || {};
            return true;
        } else {
            console.log(`[!] Login failed: ${res.detail}`);
            return false;
        }
    }

    async license(licenseKey) {
        if (!this.initialized) {
            console.log("[!] Please run init() first.");
            return false;
        }

        const data = {
            app_secret: this.secret,
            license_key: licenseKey,
            hwid: this.getHwid()
        };

        const res = await this._post("license_login", data);

        if (res.access_token) {
            console.log("[*] Successfully authenticated via license!");
            this.sessionid = res.access_token;
            this.userData = res.user || {};
            return true;
        } else {
            console.log(`[!] License login failed: ${res.detail}`);
            return false;
        }
    }

    var(varName) {
        if (!this.initialized) return null;
        return this.appData.variables ? this.appData.variables[varName] : null;
    }
}

module.exports = AuthSys;
