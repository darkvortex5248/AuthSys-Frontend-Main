/**
 * AuthSys TypeScript SDK — live API test (run with `npx tsx`).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(process.env.AUTHSYS_CONFIG || path.join(__dirname, '../../config.json'), 'utf-8'));

import { AuthSys } from '../../sdk/AuthSys-TS-Example/src/authsys';

function report(tag: string, ok: boolean, detail = '') {
    console.log(`[${ok ? 'PASS' : 'FAIL'}] ${tag} ${detail}`);
}

(async () => {
    const auth = new AuthSys({
        appSecret: config.app_secret,
        appName: config.app_name,
        version: config.app_version,
        apiUrl: config.api_url,
        hwid: config.hwid,
    });

    try {
        const r = await auth.init();
        report('init', r.status === 'success', `status=${r.status}`);
    } catch (e: any) {
        report('init', false, String(e.message || e));
    }

    try {
        const r = await auth.login(config.username, config.password, 3600);
        report('login', !!(r.success && r.token), `user=${r.username}`);
    } catch (e: any) {
        report('login', false, String(e.message || e));
    }

    try {
        const r = await auth.verify();
        report('verify', r.valid === true, `user=${r.username}`);
    } catch (e: any) {
        report('verify', false, String(e.message || e));
    }

    try {
        const r = await auth.licenseCheck(config.fake_license);
        report('license_check', r.valid === false, `valid=${r.valid} (expect False for fake key)`);
    } catch (e: any) {
        report('license_check', false, String(e.message || e));
    }

    try {
        const r = await auth.registerDevice(config.hwid, 'SDK-Test-Device');
        report('device_register', r.active === true, `device_id=${r.device_id}`);
    } catch (e: any) {
        report('device_register', false, String(e.message || e));
    }

    try {
        const r = await auth.checkDevice(config.hwid);
        report('device_check', r.active === true, `msg=${r.message}`);
    } catch (e: any) {
        report('device_check', false, String(e.message || e));
    }

    try {
        const r = await auth.sendChatMessage(1, 'sdk-test');
        report('chat_send', r.status === 'sent', JSON.stringify(r));
    } catch (e: any) {
        console.log(`[INFO] chat_send requires room_id: ${e.message || e}`);
    }
})();