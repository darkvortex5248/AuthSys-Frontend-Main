const dotenv = require("dotenv");
dotenv.config();

const { TOKEN, DEVELOPMENT_SERVER_ID, TYPE } = process.env;

if (!TOKEN || !DEVELOPMENT_SERVER_ID || !TYPE) {
    throw new Error("Missing required environment variables: TOKEN, DEVELOPMENT_SERVER_ID, TYPE");
}

// Endpoint name mapping (old KeyAuth → RinoxAuth)
const ENDPOINT_MAP = {
  '/fetch-keys': '/list-keys', '/fetch-users': '/list-users', '/fetch-usernames': '/list-users',
  '/fetch-subscriptions': '/list-users', '/fetch-sessions': '/list-sessions', '/fetch-chats': '/list-chats',
  '/fetch-files': '/list-users', '/fetch-variables': '/list-variables', '/fetch-blacklists': '/list-blacklists',
  '/fetch-webhooks': '/list-webhooks', '/fetch-buttons': '/list-webhooks', '/fetch-mutes': '/list-users',
  '/fetch-logs': '/list-users', '/fetch-team': '/list-users', '/fetch-user-vars': '/list-variables',
  '/user-key': '/list-keys', '/add-subscription': '/list-users', '/edit-subscription': '/list-users',
  '/delete-application-subscription': '/list-users', '/pause-subscription': '/list-users',
  '/unpause-subscription': '/list-users', '/delete-user-subscription': '/list-users',
  '/count-subscriptions': '/list-users', '/verify-seller': '/app-stats', '/verify-seller-key': '/app-stats',
  '/assign-key': '/generate-key', '/activate-key': '/generate-key', '/add-key-time': '/extend-user',
  '/set-key-note': '/key-info', '/add-hwid': '/reset-hwid', '/set-user-cooldown': '/user-info',
  '/delete-all-logs': '/app-stats', '/get-settings': '/app-stats', '/pause-application': '/app-stats',
  '/unpause-application': '/app-stats', '/add-hash': '/app-stats', '/reset-hash': '/app-stats',
  '/get-variable': '/list-variables', '/mass-delete-user-variables': '/delete-all-variables',
  '/edit-variable': '/add-variable', '/create-account': '/list-users', '/delete-account': '/list-users',
  '/set-reseller-balance': '/list-users', '/get-reseller-balance': '/list-users',
  '/create-webhook': '/add-webhook', '/add-button': '/add-webhook', '/delete-button': '/delete-webhook',
  '/delete-all-buttons': '/delete-all-webhooks', '/clear-channel': '/delete-channel',
  '/mute-user': '/ban-user', '/unmute-user': '/unban-user', '/edit-channel': '/add-channel',
  '/upload-file': '/add-user', '/fetch-file': '/list-users', '/edit-file': '/add-user',
  '/delete-all-files': '/delete-all-users', '/delete-all-used': '/list-keys',
  '/delete-all-unused': '/list-keys', '/delete-all-keys': '/list-keys',
  '/app-detail': '/app-details', '/app-stats': '/app-stats',
};

const sellerAppCache = new Map();

const config = {
    token: TOKEN,
    DevelopmentServerId: DEVELOPMENT_SERVER_ID,
    type: TYPE || "development",
    apiUrl: process.env.API_URL || "https://authsys-main-production.up.railway.app/api/v1/developer/sellers",

    /**
     * Make an API request to the RinoxAuth Seller API.
     * @param {string} endpoint - endpoint path
     * @param {object} data - query params
     * @param {string|null} sellerKey - seller API key
     * @returns {Promise<object>} API response
     */
    async api(endpoint, data = {}, sellerKey = null) {
        const mapped = ENDPOINT_MAP[endpoint] || endpoint;
        if (sellerKey && !data.app_id && !data.appId) {
            const cached = sellerAppCache.get(sellerKey);
            if (cached) data.app_id = cached;
        }
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(data)) {
            if (v !== undefined && v !== null) params.append(k, String(v));
        }
        const qs = params.toString();
        const url = `${config.apiUrl}${mapped}${qs ? '?' + qs : ''}`;
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(sellerKey ? { 'seller-key': sellerKey } : {}),
                },
            });
            return await res.json();
        } catch (e) {
            console.error(`API error [${endpoint}]:`, e.message);
            return { status: 'error', message: e.message };
        }
    },

    /**
     * Cache app_id for a seller key.
     */
    cacheAppId(sellerKey, appId) {
        if (sellerKey && appId) sellerAppCache.set(sellerKey, appId);
    },
};

if (config.type !== "production" && !config.DevelopmentServerId) {
    throw new Error("Missing Development Server Id!");
}

module.exports = config;
