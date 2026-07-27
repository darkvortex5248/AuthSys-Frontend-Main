/**
 * AuthSys TypeScript SDK - Example
 *
 * Demonstrates all SDK features: init, register, login, license login, verify, etc.
 */

import { AuthSys, AuthSysException, AuthSysOptions } from '../src/authsys';

async function main(): Promise<void> {
    const auth = new AuthSys({
        appSecret: 'YOUR_APP_SECRET',
        appName: 'MyApplication',
        version: '1.0.0',
        enableLogging: true,
    });

    try {
        console.log('=== Initializing ===');
        const initResult = await auth.init();
        console.log(`Status: ${initResult.status}`);
        console.log(`Message: ${initResult.message}`);
        console.log(`Version: ${initResult.current_version}`);

        if (initResult.status === 'update_required') {
            console.log('Update required! Please update the application.');
            return;
        }

        console.log('\n=== Registering ===');
        const registerResult = await auth.register('testuser', 'Password123!', 'AUTHSYS-KEY-123456');
        console.log(`Success: ${registerResult.success}`);
        console.log(`Message: ${registerResult.message}`);

        console.log('\n=== Logging in ===');
        const loginResult = await auth.login('testuser', 'Password123!');
        console.log(`Success: ${loginResult.success}`);
        console.log(`Username: ${loginResult.username}`);
        console.log(`Token: ${loginResult.token}`);

        console.log('\n=== Verifying ===');
        const verifyResult = await auth.verify();
        console.log(`Valid: ${verifyResult.valid}`);
        console.log(`Username: ${verifyResult.username}`);

        console.log('\n=== License Login ===');
        const licenseLoginResult = await auth.licenseLogin('AUTHSYS-KEY-123456');
        console.log(`Success: ${licenseLoginResult.success}`);
        console.log(`Username: ${licenseLoginResult.username}`);

        console.log('\n=== License Check ===');
        const licenseCheckResult = await auth.licenseCheck('AUTHSYS-KEY-123456');
        console.log(`Valid: ${licenseCheckResult.valid}`);
        console.log(`Key Type: ${licenseCheckResult.key_type}`);

        console.log('\n=== Variables ===');
        const variables = auth.getAllVariables();
        for (const [key, value] of Object.entries(variables)) {
            console.log(`  ${key}: ${value}`);
        }

        console.log('\n=== Sending chat message ===');
        const chatResult = await auth.sendChatMessage(1, 'Hello World!');
        console.log(`Status: ${chatResult.status}`);

        console.log('\n=== Device Registration ===');
        const deviceResult = await auth.registerDevice('HWID123', 'My Device');
        console.log(`Active: ${deviceResult.active}`);
        console.log(`Device ID: ${deviceResult.device_id}`);

        console.log('\n=== Logging out ===');
        auth.logout();
        console.log(`Is Authenticated: ${auth.isAuthenticated}`);

    } catch (e) {
        if (e instanceof AuthSysException) {
            console.log(`Auth Error [${e.errorCode}]: ${e.message}`);
        } else {
            console.log(`Error: ${(e as Error).message}`);
        }
    }
}

main();
