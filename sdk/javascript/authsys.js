/**
 * 🛡️ AuthSys JavaScript/TypeScript SDK
 * Works with Node.js and Browser environments
 * 
 * Website credentials order (Applications → Manage):
 *   new AuthSys(appSecret, ownerId, version, baseUrl)
 * 
 * The SDK auto-detects which value is the 64-char secret vs 12-char owner ID,
 * so swapped credentials still work.
 */
class AuthSys {
    constructor(credentialA, credentialB, version = "1.0.0", baseUrl = "http://localhost:8000/api/v1") {
        const resolved = this._resolveCredentials(credentialA, credentialB);
        this.appSecret = resolved.appSecret;
        this.ownerId = resolved.ownerId || "";
        this.version = version || "1.0.0";
        this.baseUrl = this._normalizeBaseUrl(baseUrl);
        this.sessionToken = null;
        this.userData = null;
        this.hwid = null;
        this.heartbeatInterval = null;
        this.timeout = 90000; // 90 seconds
    }

    // ── Credential resolution ──────────────────────────────────────────

    _resolveCredentials(a, b) {
        a = (a || "").trim();
        b = (b || "").trim();

        if (!b) return { appSecret: a, ownerId: null };

        const aIsSecret = this._looksLikeAppSecret(a);
        const bIsSecret = this._looksLikeAppSecret(b);

        if (aIsSecret && !bIsSecret) return { appSecret: a, ownerId: b };
        if (bIsSecret && !aIsSecret) return { appSecret: b, ownerId: a };

        // Ambiguous — prefer longer string as secret (64-char hex vs 12-char id)
        if (a.length >= b.length) return { appSecret: a, ownerId: b };
        return { appSecret: b, ownerId: a };
    }

    _looksLikeAppSecret(s) {
        return s.length >= 32 && /^[a-fA-F0-9]+$/.test(s);
    }

    _normalizeBaseUrl(url) {
        url = (url || "").trim().replace(/\/$/, "");
        if (!url.endsWith("/api/v1")) {
            if (url.indexOf("/api/v1") < 0) {
                url += "/api/v1";
            }
        }
        return url;
    }

    // ── HWID Generation ────────────────────────────────────────────────

    async getHWID() {
        if (this.hwid) return this.hwid;

        if (typeof window !== 'undefined') {
            // Browser: Canvas fingerprinting
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
            this.hwid = `web-${crc}-${b64.substring(0, 16)}`;
        } else {
            // Node.js: System info
            const os = await import('os');
            const crypto = await import('crypto');
            const id = os.hostname() + os.arch() + os.totalmem();
            this.hwid = crypto.createHash('sha256').update(id).digest('hex');
        }
        return this.hwid;
    }

    // ── API Methods ─────────────────────────────────────────────────────

    /**
     * Initialize the app — checks version and fetches global variables.
     * Returns JSON with "success": true/false.
     */
    async init() {
        const payload = {
            app_secret: this.appSecret,
            version: this.version,
            hwid: await this.getHWID(),
            app_name: this.ownerId || "client"
        };
        return this._request("init", payload);
    }

    /**
     * Register a new user with a license key.
     */
    async register(username, password, licenseKey, email = null) {
        const payload = {
            app_secret: this.appSecret,
            username,
            password,
            license_key: licenseKey,
            hwid: await this.getHWID()
        };
        if (email) payload.email = email;
        return this._request("register", payload);
    }

    /**
     * Login with username and password.
     */
    async login(username, password, sessionLength = 86400) {
        const payload = {
            app_secret: this.appSecret,
            username,
            password,
            hwid: await this.getHWID(),
            version: this.version,
            session_length: sessionLength
        };
        const result = await this._request("login", payload);
        this._captureToken(result);
        return result;
    }

    /**
     * Login with a license key only (no username/password needed).
     */
    async licenseLogin(licenseKey, sessionLength = 86400) {
        const payload = {
            app_secret: this.appSecret,
            license_key: licenseKey,
            hwid: await this.getHWID(),
            session_length: sessionLength
        };
        const result = await this._request("license-login", payload);
        this._captureToken(result);
        return result;
    }

    /**
     * Check if a license key is valid without logging in.
     */
    async checkLicense(licenseKey) {
        const payload = {
            app_secret: this.appSecret,
            license_key: licenseKey
        };
        return this._request("license/check", payload);
    }

    /**
     * Verify the current session token is still valid.
     */
    async verify() {
        if (!this.sessionToken) {
            return { success: false, message: "No active session. Login first." };
        }
        return this._requestWithAuth("verify");
    }

    // ── Helper Methods ─────────────────────────────────────────────────

    _captureToken(result) {
        if (result && result.success && result.token) {
            this.sessionToken = result.token;
            this.userData = result.user;
        }
    }

    async _request(endpoint, payload) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(`${this.baseUrl}/client/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'User-Agent': 'AuthSys-JS-SDK/2.0' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            return await this._parseResponse(response);
        } catch (error) {
            if (error.name === 'AbortError') {
                return { success: false, message: "Request timed out. The server may be starting up — try again in a few seconds." };
            }
            return { success: false, message: `Connection error: ${error.message}` };
        }
    }

    async _requestWithAuth(endpoint) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(`${this.baseUrl}/client/${endpoint}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.sessionToken}`,
                    'X-HWID': await this.getHWID(),
                    'User-Agent': 'AuthSys-JS-SDK/2.0'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            return await this._parseResponse(response);
        } catch (error) {
            if (error.name === 'AbortError') {
                return { success: false, message: "Request timed out." };
            }
            return { success: false, message: `Connection error: ${error.message}` };
        }
    }

    async _parseResponse(response) {
        try {
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                return { success: false, message: text };
            }

            if (data.detail) {
                return { success: false, message: typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail) };
            }

            // Handle init endpoint response format
            if (response.ok && !data.hasOwnProperty('success')) {
                if (data.status) {
                    const ok = data.status === 'success' || data.status === 'update_available';
                    const message = data.message || data.status;
                    return { success: ok, message, status: data.status, data };
                }
                return { success: true, message: "OK", data };
            }

            return data;
        } catch (error) {
            return { success: false, message: `Parse error: ${error.message}` };
        }
    }

    // ── Session Management ───────────────────────────────────────────────

    logout() {
        this.sessionToken = null;
        this.userData = null;
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    startHeartbeat() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(async () => {
            if (!this.sessionToken) {
                clearInterval(this.heartbeatInterval);
                return;
            }
            try {
                const result = await this.verify();
                if (!result.success) {
                    this.sessionToken = null;
                    clearInterval(this.heartbeatInterval);
                }
            } catch (e) {
                // Silent retry on connection blip
            }
        }, 60000); // Every 60 seconds
    }

    // ── Getters ─────────────────────────────────────────────────────────

    get AppSecret() { return this.appSecret; }
    get OwnerId() { return this.ownerId; }
    get Version() { return this.version; }
    get BaseUrl() { return this.baseUrl; }
    get SessionToken() { return this.sessionToken; }
    get Hwid() { return this.hwid; }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthSys;
}
if (typeof window !== 'undefined') {
    window.AuthSys = AuthSys;
}
export default AuthSys;
