const https = require("https");
const http = require("http");
const crypto = require("crypto");
const os = require("os");

class Device {
  constructor(appSecret, baseUrl = "https://authsys-main-production.up.railway.app/device") {
    this.appSecret = appSecret;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.lastError = "";
    this.lastResponse = "";
  }

  static _getHWID() {
    try {
      const serial = os.hostname() + "-" + os.platform() + "-" + os.arch();
      return crypto.createHash("md5").update(serial).digest("hex").toUpperCase();
    } catch {
      return "unknown";
    }
  }

  _request(endpoint, payload) {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.baseUrl}/${endpoint}`);
      const data = JSON.stringify(payload);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
        rejectUnauthorized: false,
        timeout: 15000,
      };
      const mod = url.protocol === "https:" ? https : http;
      const req = mod.request(options, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve(body));
      });
      req.on("error", (err) => reject(err));
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timed out"));
      });
      req.write(data);
      req.end();
    });
  }

  async check() {
    this.lastError = "";
    try {
      this.lastResponse = await this._request("check", {
        device_key: this.appSecret,
        hwid: Device._getHWID(),
      });
      const data = JSON.parse(this.lastResponse);
      if (data.active === true) return true;
      this.lastError = data.message || "Device deactivated by admin";
      return false;
    } catch (err) {
      this.lastError = err.message;
      return false;
    }
  }

  async register(deviceName = "") {
    this.lastError = "";
    try {
      const payload = { device_key: this.appSecret, hwid: Device._getHWID() };
      if (deviceName) payload.device_name = deviceName;
      this.lastResponse = await this._request("register", payload);
      const data = JSON.parse(this.lastResponse);
      return data.active === true;
    } catch (err) {
      this.lastError = err.message;
      return false;
    }
  }
}

module.exports = { Device };
