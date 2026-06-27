const config = require('./config');

// Cache: maps sellerKey → appId
const sellerAppMap = new Map();

// Maps old KeyAuth-style endpoint names to RinoxAuth Seller API endpoints
const ENDPOINT_MAP = {
  '/fetch-keys': '/list-keys',
  '/fetch-users': '/list-users',
  '/fetch-usernames': '/list-users',
  '/fetch-subscriptions': '/list-users',
  '/fetch-sessions': '/list-sessions',
  '/fetch-chats': '/list-chats',
  '/fetch-files': '/list-users',
  '/fetch-variables': '/list-variables',
  '/fetch-blacklists': '/list-blacklists',
  '/fetch-webhooks': '/list-webhooks',
  '/fetch-buttons': '/list-webhooks',
  '/fetch-mutes': '/list-users',
  '/fetch-logs': '/list-users',
  '/fetch-team': '/list-users',
  '/fetch-user-vars': '/list-variables',
  '/user-key': '/list-keys',
  '/add-subscription': '/list-users',
  '/edit-subscription': '/list-users',
  '/delete-application-subscription': '/list-users',
  '/pause-subscription': '/list-users',
  '/unpause-subscription': '/list-users',
  '/delete-user-subscription': '/list-users',
  '/count-subscriptions': '/list-users',
  '/verify-seller': '/app-stats',
  '/verify-seller-key': '/app-stats',
  '/assign-key': '/generate-key',
  '/activate-key': '/generate-key',
  '/add-key-time': '/extend-user',
  '/set-key-note': '/key-info',
  '/add-hwid': '/reset-hwid',
  '/set-user-cooldown': '/user-info',
  '/delete-all-logs': '/app-stats',
  '/get-settings': '/app-stats',
  '/pause-application': '/app-stats',
  '/unpause-application': '/app-stats',
  '/add-hash': '/app-stats',
  '/reset-hash': '/app-stats',
  '/get-variable': '/list-variables',
  '/mass-delete-user-variables': '/delete-all-variables',
  '/edit-variable': '/add-variable',
  '/create-account': '/list-users',
  '/delete-account': '/list-users',
  '/set-reseller-balance': '/list-users',
  '/get-reseller-balance': '/list-users',
  '/create-webhook': '/add-webhook',
  '/add-button': '/add-webhook',
  '/delete-button': '/delete-webhook',
  '/delete-all-buttons': '/delete-all-webhooks',
  '/clear-channel': '/delete-channel',
  '/mute-user': '/ban-user',
  '/unmute-user': '/unban-user',
  '/edit-channel': '/add-channel',
  '/upload-file': '/add-user',
  '/fetch-file': '/list-users',
  '/edit-file': '/add-user',
  '/delete-all-files': '/delete-all-users',
  '/delete-all-used': '/list-keys',
  '/delete-all-unused': '/list-keys',
  '/delete-all-keys': '/list-keys',
  '/app-detail': '/app-details',
  '/app-stats': '/app-stats',
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
