const config = require('./config');

// Cache: maps sellerKey → appId
const sellerAppMap = new Map();

// Maps old KeyAuth-style endpoint names to RinoxAuth Seller API endpoints
const ENDPOINT_MAP = {
  // ── Read / List ──
  '/fetch-keys': '/list-keys',
  '/fetch-users': '/list-users',
  '/fetch-usernames': '/list-users',
  '/fetch-subscriptions': '/list-users',
  '/fetch-sessions': '/list-sessions',
  '/fetch-chats': '/list-chats',
  '/fetch-variables': '/list-variables',
  '/fetch-blacklists': '/list-blacklists',
  '/fetch-webhooks': '/list-webhooks',
  '/fetch-buttons': '/list-webhooks',
  '/fetch-mutes': '/list-users',
  '/fetch-logs': '/list-users',
  '/fetch-team': '/list-users',
  '/fetch-files': '/list-users',
  '/fetch-user-vars': '/list-variables',
  '/user-key': '/list-keys',
  '/get-variable': '/list-variables',

  // ── User Write ──
  '/add-user': '/add-user',
  '/delete-user': '/delete-user',
  '/user-info': '/user-data',
  '/edit-username': '/edit-username',
  '/edit-email': '/edit-email',
  '/reset-password': '/reset-password',
  '/pause-user': '/pause-user',
  '/unpause-user': '/unpause-user',
  '/subtract': '/subtract',
  '/ban-user': '/ban-user',
  '/unban-user': '/unban-user',
  '/extend-user': '/extend-user',
  '/reset-hwid': '/reset-hwid',
  '/add-hwid': '/reset-hwid',
  '/set-user-cooldown': '/user-data',
  '/delete-all-users': '/delete-all-users',
  '/delete-expired-users': '/delete-expired-users',
  '/set-user-variable': '/set-user-variable',
  '/delete-user-variable': '/delete-user-variable',
  '/mass-delete-user-variables': '/delete-all-variables',

  // ── License Key Write ──
  '/generate-key': '/generate-key',
  '/delete-key': '/delete-key',
  '/key-info': '/key-info',
  '/set-key-note': '/key-info',
  '/ban-key': '/ban-key',
  '/unban-key': '/unban-key',
  '/verify-key': '/verify-key',
  '/add-key-time': '/extend-user',
  '/delete-all-used': '/list-keys',
  '/delete-all-unused': '/list-keys',
  '/delete-all-keys': '/list-keys',

  // ── Sessions ──
  '/kill-session': '/kill-session',
  '/kill-all-sessions': '/kill-all-sessions',

  // ── Chats ──
  '/add-channel': '/add-channel',
  '/delete-channel': '/delete-channel',
  '/edit-channel': '/add-channel',
  '/clear-channel': '/delete-channel',
  '/mute-user': '/ban-user',
  '/unmute-user': '/unban-user',

  // ── Variables ──
  '/add-variable': '/add-variable',
  '/edit-variable': '/add-variable',
  '/delete-variable': '/delete-variable',
  '/delete-all-variables': '/delete-all-variables',

  // ── Blacklist ──
  '/add-blacklist': '/add-blacklist',
  '/delete-blacklist': '/delete-blacklist',
  '/delete-all-blacklists': '/delete-all-blacklists',

  // ── Whitelist ──
  '/add-whitelist': '/add-whitelist',
  '/delete-whitelist': '/delete-whitelist',
  '/delete-all-whitelists': '/delete-all-whitelists',

  // ── Webhooks / Buttons ──
  '/create-webhook': '/add-webhook',
  '/delete-webhook': '/delete-webhook',
  '/delete-all-webhooks': '/delete-all-webhooks',
  '/add-button': '/add-webhook',
  '/delete-button': '/delete-webhook',
  '/delete-all-buttons': '/delete-all-webhooks',

  // ── App ──
  '/app-stats': '/app-stats',
  '/app-detail': '/app-details',
  '/get-settings': '/app-stats',
  '/pause-application': '/app-stats',
  '/unpause-application': '/app-stats',
  '/add-hash': '/app-stats',
  '/reset-hash': '/app-stats',
  '/delete-all-logs': '/app-stats',

  // ── Seller ──
  '/verify-seller': '/verify-seller',
  '/verify-seller-key': '/verify-seller-key',

  // ── Subscriptions (fallback to user ops) ──
  '/assign-key': '/generate-key',
  '/activate-key': '/add-user',
  '/add-subscription': '/add-user',
  '/edit-subscription': '/extend-user',
  '/delete-application-subscription': '/delete-user',
  '/pause-subscription': '/pause-user',
  '/unpause-subscription': '/unpause-user',
  '/delete-user-subscription': '/delete-user',
  '/count-subscriptions': '/list-users',

  // ── Subscription Activation Codes ──
  '/subscription-plan': '/subscription-plan',
  '/subscription-redeem': '/subscription-redeem',
  '/subscription-codes': '/subscription-codes',

  // ── Reseller / Manager ──
  '/create-account': '/add-user',
  '/delete-account': '/delete-user',
  '/set-reseller-balance': '/app-stats',
  '/get-reseller-balance': '/app-stats',

  // ── Files ──
  '/upload-file': '/add-user',
  '/fetch-file': '/list-users',
  '/edit-file': '/add-user',
  '/delete-all-files': '/delete-all-users',
};

/**
 * Makes a request to the AuthSys Seller API.
 * @param {string} endpoint - API endpoint path
 * @param {object} data - Query parameters
 * @param {string} sellerKey - Seller API key (optional if set via setSellerAppId)
 * @returns {Promise<object>} Response data
 */
async function requestApi(endpoint, data = {}, sellerKey = null) {
  const mappedEndpoint = ENDPOINT_MAP[endpoint] || endpoint;

  // Auto-inject app_id if cached
  if (sellerKey && !data.app_id && !data.appId) {
    const cachedAppId = sellerAppMap.get(sellerKey);
    if (cachedAppId) {
      data.app_id = cachedAppId;
    }
  }

  // Build query string
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  }
  const queryString = params.toString();
  const url = `${config.apiUrl}${mappedEndpoint}${queryString ? '?' + queryString : ''}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sellerKey ? { 'seller-key': sellerKey } : {}),
      },
    });
    return await response.json();
  } catch (error) {
    console.error(`API request error [${endpoint}]:`, error.message);
    return { status: 'error', message: error.message };
  }
}

/**
 * Cache the app_id for a seller key so future requests auto-inject it.
 * @param {string} sellerKey
 * @param {string} appId
 */
function setSellerAppId(sellerKey, appId) {
  if (sellerKey && appId) {
    sellerAppMap.set(sellerKey, appId);
  }
}

module.exports = { requestApi, setSellerAppId };
