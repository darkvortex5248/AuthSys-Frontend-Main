<?php
/**
 * AuthSys PHP SDK - Example
 *
 * Demonstrates all SDK features: init, register, login, license login, verify, etc.
 */

require_once __DIR__ . '/../AuthSys.php';
require_once __DIR__ . '/../Helpers.php';

$auth = new AuthSys('YOUR_APP_SECRET', [
    'appName' => 'MyApplication',
    'version' => '1.0.0',
    'enableLogging' => true,
]);

try {
    echo "=== Initializing ===\n";
    $initResult = $auth->init();
    echo "Status: " . ($initResult['status'] ?? '') . "\n";
    echo "Message: " . ($initResult['message'] ?? '') . "\n";
    echo "Version: " . ($initResult['current_version'] ?? '') . "\n";

    if (($initResult['status'] ?? '') === 'update_required') {
        echo "Update required! Please update the application.\n";
        return;
    }

    echo "\n=== Registering ===\n";
    $registerResult = $auth->register('testuser', 'Password123!', 'AUTHSYS-KEY-123456');
    echo "Success: " . ($registerResult['success'] ?? false) . "\n";
    echo "Message: " . ($registerResult['message'] ?? '') . "\n";

    echo "\n=== Logging in ===\n";
    $loginResult = $auth->login('testuser', 'Password123!');
    echo "Success: " . ($loginResult['success'] ?? false) . "\n";
    echo "Username: " . ($loginResult['username'] ?? '') . "\n";
    echo "Token: " . ($loginResult['token'] ?? '') . "\n";

    echo "\n=== Verifying ===\n";
    $verifyResult = $auth->verify();
    echo "Valid: " . ($verifyResult['valid'] ?? false) . "\n";
    echo "Username: " . ($verifyResult['username'] ?? '') . "\n";

    echo "\n=== License Login ===\n";
    $licenseLoginResult = $auth->licenseLogin('AUTHSYS-KEY-123456');
    echo "Success: " . ($licenseLoginResult['success'] ?? false) . "\n";
    echo "Username: " . ($licenseLoginResult['username'] ?? '') . "\n";

    echo "\n=== License Check ===\n";
    $licenseCheckResult = $auth->licenseCheck('AUTHSYS-KEY-123456');
    echo "Valid: " . ($licenseCheckResult['valid'] ?? false) . "\n";
    echo "Key Type: " . ($licenseCheckResult['key_type'] ?? '') . "\n";

    echo "\n=== Variables ===\n";
    $variables = $auth->getAllVariables();
    foreach ($variables as $key => $value) {
        echo "  {$key}: {$value}\n";
    }

    echo "\n=== Sending chat message ===\n";
    $chatResult = $auth->sendChatMessage(1, 'Hello World!');
    echo "Status: " . ($chatResult['status'] ?? '') . "\n";

    echo "\n=== Device Registration ===\n";
    $deviceResult = $auth->registerDevice('HWID123', 'My Device');
    echo "Active: " . ($deviceResult['active'] ?? false) . "\n";
    echo "Device ID: " . ($deviceResult['device_id'] ?? '') . "\n";

    echo "\n=== Logging out ===\n";
    $auth->logout();
    echo "Is Authenticated: " . ($auth->isAuthenticated() ? 'true' : 'false') . "\n";

} catch (AuthSysException $e) {
    echo "Auth Error [{$e->errorCode}]: {$e->getMessage()}\n";
} catch (Exception $e) {
    echo "Error: {$e->getMessage()}\n";
}
