/**
 * AuthSys JavaScript SDK - Helper functions
 *
 * Platform-specific utilities for HWID, hashing, and other helpers.
 */

const crypto = require('crypto');
const os = require('os');
const { execSync } = require('child_process');
const fs = require('fs');

function getHwid() {
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

function hashString(input) {
    return crypto.createHash('sha256').update(input).digest('hex');
}

function generateGuid() {
    return crypto.randomUUID();
}

function isWindows() {
    return os.platform() === 'win32';
}

function isLinux() {
    return os.platform() === 'linux';
}

function isMacOS() {
    return os.platform() === 'darwin';
}

module.exports = { getHwid, hashString, generateGuid, isWindows, isLinux, isMacOS };
