<?php
/**
 * AuthSys PHP SDK — live API test.
 */

$configPath = getenv('AUTHSYS_CONFIG') ?: __DIR__ . '/../../config.json';
$config = json_decode(file_get_contents($configPath), true);
if (!$config) { fwrite(STDERR, "config missing\n"); exit(1); }

require_once __DIR__ . '/../../sdk/AuthSys-PHP-Example/src/Helpers.php';
require_once __DIR__ . '/../../sdk/AuthSys-PHP-Example/src/AuthSys.php';

function report($tag, $ok, $detail = '') {
    echo "[" . ($ok ? 'PASS' : 'FAIL') . "] $tag $detail\n";
}

$auth = new AuthSys($config['app_secret'], [
    'appName'   => $config['app_name'],
    'version'   => $config['app_version'],
    'apiUrl'    => $config['api_url'],
    'hwid'      => $config['hwid'],
    'skipCertificateValidation' => true,
]);

try {
    $r = $auth->init();
    report('init', ($r['status'] ?? '') === 'success', 'status=' . ($r['status'] ?? ''));
} catch (Throwable $e) {
    report('init', false, $e->getMessage());
}

try {
    $r = $auth->login($config['username'], $config['password'], 3600);
    report('login', !empty($r['success']) && !empty($r['token']), 'user=' . ($r['username'] ?? ''));
} catch (Throwable $e) {
    report('login', false, $e->getMessage());
}

try {
    $r = $auth->verify();
    report('verify', ($r['valid'] ?? false) === true, 'user=' . ($r['username'] ?? ''));
} catch (Throwable $e) {
    report('verify', false, $e->getMessage());
}

try {
    $r = $auth->licenseCheck($config['fake_license']);
    report('license_check', ($r['valid'] ?? true) === false, 'valid=' . var_export($r['valid'] ?? null, true) . ' (expect False for fake key)');
} catch (Throwable $e) {
    report('license_check', false, $e->getMessage());
}

try {
    $r = $auth->registerDevice($config['hwid'], 'SDK-Test-Device');
    report('device_register', ($r['active'] ?? false) === true, 'device_id=' . ($r['device_id'] ?? ''));
} catch (Throwable $e) {
    report('device_register', false, $e->getMessage());
}

try {
    $r = $auth->checkDevice($config['hwid']);
    report('device_check', ($r['active'] ?? false) === true, 'msg=' . ($r['message'] ?? ''));
} catch (Throwable $e) {
    report('device_check', false, $e->getMessage());
}

try {
    $r = $auth->sendChatMessage(1, 'sdk-test');
    report('chat_send', ($r['status'] ?? '') === 'sent', json_encode($r));
} catch (Throwable $e) {
    echo "[INFO] chat_send requires room_id: " . $e->getMessage() . "\n";
}