import * as crypto from 'crypto';
import * as os from 'os';

interface DeviceResponse {
  active?: boolean;
  message?: string;
  device_id?: number;
}

export class Device {
  public lastError = '';
  public lastResponse = '';
  private readonly server: string;

  constructor(
    private readonly appSecret: string,
    baseUrl = 'https://authsys-main-production.up.railway.app/device'
  ) {
    this.server = baseUrl.replace(/\/+$/, '');
  }

  private static getHWID(): string {
    try {
      const serial = `${os.hostname()}-${os.platform()}-${os.arch()}`;
      return crypto.createHash('md5').update(serial).digest('hex').toUpperCase();
    } catch {
      return 'unknown';
    }
  }

  private async request<T>(endpoint: string, payload: Record<string, string>): Promise<T | null> {
    try {
      const res = await fetch(`${this.server}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      this.lastResponse = await res.text();
      return JSON.parse(this.lastResponse) as T;
    } catch (err: any) {
      this.lastError = err.message;
      return null;
    }
  }

  async check(): Promise<boolean> {
    this.lastError = '';
    const data = await this.request<DeviceResponse>('check', {
      device_key: this.appSecret,
      hwid: Device.getHWID(),
    });
    if (!data) return false;
    if (data.active === true) return true;
    this.lastError = data.message || 'Device deactivated by admin';
    return false;
  }

  async register(deviceName = ''): Promise<boolean> {
    this.lastError = '';
    const payload: Record<string, string> = {
      device_key: this.appSecret,
      hwid: Device.getHWID(),
    };
    if (deviceName) payload.device_name = deviceName;
    const data = await this.request<DeviceResponse>('register', payload);
    return data?.active === true;
  }
}
