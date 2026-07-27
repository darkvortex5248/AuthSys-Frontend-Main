/**
 * AuthSys TypeScript SDK - Helper functions
 *
 * Platform-specific utilities for HWID, hashing, and other helpers.
 */

import * as crypto from 'crypto';
import * as os from 'os';
import * as fs from 'fs';
import { execSync } from 'child_process';

export function getHwid(): string {
    try {
        if (os.platform() === 'win32') {
            const output = execSync('wmic csproduct get uuid', { encoding: 'utf-8' });
            const lines = output.split('\n').filter(l => l.trim());
            if (lines.length > 1) return lines[1].trim();
        } else if (os.platform() === 'linux') {
            if (fs.existsSync('/etc/machine-id')) {
                return fs.readFileSync('/etc/machine-id', 'utf-8').trim();
            }
            if (fs.existsSync('/proc/sys/kernel/random/boot_id')) {
                return fs.readFileSync('/proc/sys/kernel/random/boot_id', 'utf-8').trim();
            }
        } else if (os.platform() === 'darwin') {
            const output = execSync('ioreg -rd1 -c IOPlatformExpertDevice', { encoding: 'utf-8' });
            const parts = output.split('"');
            if (parts.length > 3) return parts[3];
        }
    } catch (e) {}
    return os.hostname();
}

export function hashString(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
}

export function generateGuid(): string {
    return crypto.randomUUID();
}

export function isWindows(): boolean {
    return os.platform() === 'win32';
}

export function isLinux(): boolean {
    return os.platform() === 'linux';
}

export function isMacOS(): boolean {
    return os.platform() === 'darwin';
}
