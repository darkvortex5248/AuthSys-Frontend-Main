/**
 * 🛡️ AuthSys Web/Node SDK
 * Enterprise Security Orchestration
 */
class AuthSys {
    constructor(appSecret, apiUrl = "http://localhost:8000/api/v1/client") {
        this.appSecret = appSecret;
        this.apiUrl = apiUrl;
        this.sessionToken = null;
        this.userData = null;
        this.heartbeatInterval = null;
    }

    /**
     * Generates a stable hardware fingerprint.
     * In Browser: Uses Canvas/WebAudio/WebGL fingerprinting.
     * In Node.js: Uses system info.
     */
    async getHWID() {
        if (typeof window !== 'undefined') {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = "top";
            ctx.font = "14px 'Arial'";
            ctx.textBaseline = "alphabetic";
            ctx.fillStyle = "#f60";
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = "#069";
            ctx.fillText("AuthSys-Secure-Fingerprint", 2, 15);
            ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
            ctx.fillText("AuthSys-Secure-Fingerprint", 4, 17);
            const b64 = canvas.toDataURL().replace("data:image/png;base64,", "");
            const bin = atob(b64);
            const crc = bin.length;
            return `web-${crc}-${b64.substring(0, 16)}`;
        } else {
            const os = await import('os');
            const crypto = await import('crypto');
            const id = os.hostname() + os.arch() + os.totalmem();
            return crypto.createHash('sha256').update(id).digest('hex');
        }
    }

    async login(username, password) {
        const payload = {
            app_secret: this.appSecret,
            username,
            password,
            hwid: await this.getHWID(),
            version: "1.0.0"
        };
        return this._request("login", payload);
    }

    async loginLicense(key) {
        const payload = {
            app_secret: this.appSecret,
            key,
            hwid: await this.getHWID()
        };
        return this._request("login/license", payload);
    }

    async _request(endpoint, payload) {
        try {
            const response = await fetch(`${this.apiUrl}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (response.ok) {
                this.sessionToken = data.token;
                this.userData = data.user;
                this._startHeartbeat();
                return { success: true, message: "Success" };
            }
            return { success: false, message: data.detail || "Error" };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    _startHeartbeat() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(async () => {
            if (!this.sessionToken) return clearInterval(this.heartbeatInterval);
            try {
                const resp = await fetch(`${this.apiUrl}/session/heartbeat`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${this.sessionToken}` }
                });
                if (!resp.ok) {
                    this.sessionToken = null;
                    clearInterval(this.heartbeatInterval);
                }
            } catch (e) {}
        }, 60000);
    }

    async getVar(name) {
        if (!this.sessionToken) return null;
        try {
            const resp = await fetch(`${this.apiUrl}/vars/${name}`, {
                headers: { 'Authorization': `Bearer ${this.sessionToken}` }
            });
            if (resp.ok) {
                const data = await resp.json();
                return data.value;
            }
        } catch (e) {}
        return null;
    }

    logout() {
        this.sessionToken = null;
        this.userData = null;
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    }
}

export default AuthSys;
