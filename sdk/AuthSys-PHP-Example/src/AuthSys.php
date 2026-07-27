<?php
/**
 * AuthSys PHP SDK
 *
 * Professional authentication SDK for PHP applications.
 */

class AuthSysException extends Exception
{
    public $statusCode;
    public $errorCode;

    public function __construct($message, $statusCode = 0, $errorCode = '')
    {
        parent::__construct($message);
        $this->statusCode = $statusCode;
        $this->errorCode = $errorCode;
    }
}

class AuthSys
{
    private $options;
    private $sessionToken = '';
    private $initialized = false;
    private $appVariables = [];
    private $username = '';

    public function __construct($appSecret, $options = [])
    {
        $this->options = array_merge([
            'appName' => '',
            'version' => '',
            'apiUrl' => 'https://api.authsys.dpdns.org/api/v1',
            'timeout' => 30,
            'maxRetries' => 3,
            'skipCertificateValidation' => false,
            'enableLogging' => false,
        ], $options);
        $this->options['appSecret'] = $appSecret;
    }

    private function log($message)
    {
        if ($this->options['enableLogging']) {
            echo "[AuthSys] {$message}\n";
        }
    }

    private function sendRequest($endpoint, $data = null, $headers = [])
    {
        $url = rtrim($this->options['apiUrl'], '/') . '/client/' . $endpoint;
        $jsonData = $data !== null ? json_encode($data) : null;

        $lastError = null;
        for ($attempt = 0; $attempt <= $this->options['maxRetries']; $attempt++) {
            $this->log("POST {$url} (attempt " . ($attempt + 1) . ")");

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge([
                'Content-Type: application/json',
                'Accept: application/json',
            ], array_map(function($k, $v) { return "{$k}: {$v}"; }, array_keys($headers), $headers)));
            curl_setopt($ch, CURLOPT_TIMEOUT, $this->options['timeout']);

            if ($this->options['skipCertificateValidation']) {
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
            }

            if ($jsonData !== null) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
            }

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);

            if ($error) {
                $lastError = $error;
                $this->log("Request error (attempt " . ($attempt + 1) . "): {$error}");
                if ($attempt < $this->options['maxRetries']) {
                    sleep(pow(2, $attempt));
                }
                continue;
            }

            $this->log("Response: {$httpCode} - {$response}");

            $result = json_decode($response, true) ?: [];

            if ($httpCode < 200 || $httpCode >= 300) {
                $detail = $response;
                if (isset($result['detail'])) {
                    $detail = $result['detail'];
                }
                $errorCode = 'api_error';
                switch ($httpCode) {
                    case 401: $errorCode = 'unauthorized'; break;
                    case 403: $errorCode = 'forbidden'; break;
                    case 404: $errorCode = 'not_found'; break;
                    case 429: $errorCode = 'rate_limited'; break;
                    case 503: $errorCode = 'maintenance'; break;
                }
                throw new AuthSysException($detail, $httpCode, $errorCode);
            }

            return $result;
        }

        throw new AuthSysException(
            $lastError ?: 'Request failed after all retries',
            0,
            'network_error'
        );
    }

    public function init()
    {
        $this->log('Initializing...');
        $data = [
            'app_secret' => $this->options['appSecret'],
            'version' => $this->options['version'],
            'app_name' => $this->options['appName'],
            'hwid' => getHwid(),
        ];

        $result = $this->sendRequest('init', $data);
        $status = $result['status'] ?? '';

        if ($status === 'update_required') {
            throw new AuthSysException(
                $result['message'] ?? 'Update required',
                0,
                'version_mismatch'
            );
        }

        $this->initialized = $status === 'success' || $status === 'update_available';
        $this->appVariables = $result['variables'] ?? [];
        return $result;
    }

    public function register($username, $password, $licenseKey, $email = '')
    {
        if (!$this->initialized) {
            throw new AuthSysException('Not initialized. Call init() first.', 0, 'not_initialized');
        }

        $data = [
            'app_secret' => $this->options['appSecret'],
            'username' => $username,
            'password' => $password,
            'license_key' => $licenseKey,
            'hwid' => getHwid(),
        ];
        if ($email !== '') {
            $data['email'] = $email;
        }

        return $this->sendRequest('register', $data);
    }

    public function login($username, $password, $sessionLength = 86400)
    {
        if (!$this->initialized) {
            throw new AuthSysException('Not initialized. Call init() first.', 0, 'not_initialized');
        }

        $this->sessionToken = '';
        $data = [
            'app_secret' => $this->options['appSecret'],
            'username' => $username,
            'password' => $password,
            'hwid' => getHwid(),
            'session_length' => $sessionLength,
        ];

        $result = $this->sendRequest('login', $data);
        if (isset($result['token']) && $result['token'] !== '') {
            $this->sessionToken = $result['token'];
        }
        if (isset($result['username'])) {
            $this->username = $result['username'];
        }
        return $result;
    }

    public function licenseLogin($licenseKey, $sessionLength = 86400)
    {
        if (!$this->initialized) {
            throw new AuthSysException('Not initialized. Call init() first.', 0, 'not_initialized');
        }

        $this->sessionToken = '';
        $data = [
            'app_secret' => $this->options['appSecret'],
            'license_key' => $licenseKey,
            'hwid' => getHwid(),
            'session_length' => $sessionLength,
        ];

        $result = $this->sendRequest('license-login', $data);
        if (isset($result['token']) && $result['token'] !== '') {
            $this->sessionToken = $result['token'];
        }
        if (isset($result['username'])) {
            $this->username = $result['username'];
        }
        return $result;
    }

    public function licenseCheck($licenseKey)
    {
        $data = [
            'app_secret' => $this->options['appSecret'],
            'license_key' => $licenseKey,
        ];
        return $this->sendRequest('license/check', $data);
    }

    public function verify()
    {
        if ($this->sessionToken === '') {
            throw new AuthSysException('No active session. Login first.', 0, 'no_session');
        }

        $headers = [
            'Authorization' => 'Bearer ' . $this->sessionToken,
            'X-HWID' => getHwid(),
        ];
        return $this->sendRequest('verify', null, $headers);
    }

    public function sendChatMessage($roomId, $message)
    {
        if ($this->sessionToken === '') {
            throw new AuthSysException('No active session. Login first.', 0, 'no_session');
        }

        $headers = ['Authorization' => 'Bearer ' . $this->sessionToken];
        $endpoint = 'chat/send?room_id=' . $roomId . '&message=' . urlencode($message);
        return $this->sendRequest($endpoint, null, $headers);
    }

    public function registerDevice($hwid, $deviceName = '')
    {
        $data = [
            'app_secret' => $this->options['appSecret'],
            'hwid' => $hwid,
        ];
        if ($deviceName !== '') {
            $data['device_name'] = $deviceName;
        }
        return $this->sendRequest('device/register', $data);
    }

    public function checkDevice($hwid)
    {
        $data = [
            'app_secret' => $this->options['appSecret'],
            'hwid' => $hwid,
        ];
        return $this->sendRequest('device/check', $data);
    }

    public function getVariable($key)
    {
        return $this->appVariables[$key] ?? null;
    }

    public function getAllVariables()
    {
        return $this->appVariables;
    }

    public function logout()
    {
        $this->sessionToken = '';
    }

    public function isAuthenticated()
    {
        return $this->sessionToken !== '';
    }

    public function isInitialized()
    {
        return $this->initialized;
    }

    public function getUsername()
    {
        return $this->username;
    }
}
