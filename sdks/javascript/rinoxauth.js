const axios = require('axios');
const crypto = require('crypto');
const os = require('os');

class RinoxAuth {
  constructor(appName, appSecret, apiUrl) {
    this.appName = appName;
    this.appSecret = appSecret;
    this.apiUrl = apiUrl.replace(/\/$/, '');
    this.hwid = this._generateHwid();
    this.token = null;
  }

  _generateHwid() {
    if (typeof window !== 'undefined') {
      return navigator.userAgent;
    }
    return crypto.createHash('sha256').update(os.hostname() + os.arch()).digest('hex');
  }

  async _post(endpoint, data) {
    const headers = this.token ? { Authorization: `Bearer ${this.token}` } : {};
    try {
      const res = await axios.post(`${this.apiUrl}${endpoint}`, data, { headers });
      return res.data;
    } catch (e) {
      if (e.response && e.response.status === 403) throw new Error(e.response.data.detail);
      throw e;
    }
  }

  async init(version) {
    return this._post('/client/init', { app_name: this.appName, app_secret: this.appSecret, version, hwid: this.hwid });
  }

  async register(username, password, license_key, email = null) {
    return this._post('/client/register', { app_secret: this.appSecret, username, password, license_key, email, hwid: this.hwid });
  }

  async login(username, password) {
    const res = await this._post('/client/login', { app_secret: this.appSecret, username, password, hwid: this.hwid });
    this.token = res.token;
    return res;
  }
}

module.exports = RinoxAuth;
