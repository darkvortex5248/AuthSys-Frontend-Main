<?php

class AuthSysDevice
{
    private string $appSecret;
    private string $baseUrl;
    public string $lastError = '';
    public string $lastResponse = '';

    public function __construct(string $appSecret, string $baseUrl = 'https://authsys-main-production.up.railway.app/device')
    {
        $this->appSecret = $appSecret;
        $this->baseUrl = rtrim($baseUrl, '/');
    }

    private static function getHWID(): string
    {
        if (PHP_OS_FAMILY === 'Windows') {
            $output = shell_exec('wmic bios get serialnumber 2>nul');
            if ($output) {
                $lines = explode("\n", trim($output));
                return isset($lines[1]) ? trim($lines[1]) : 'unknown';
            }
        } else {
            $id = @file_get_contents('/etc/machine-id');
            if ($id) return trim($id);
        }
        return 'unknown';
    }

    private function request(string $endpoint, array $payload): array
    {
        $url = $this->baseUrl . '/' . $endpoint;
        $json = json_encode($payload);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $json,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);

        $this->lastResponse = curl_exec($ch) ?: '';
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode($this->lastResponse, true);
        return $data ?: [];
    }

    public function check(): bool
    {
        $this->lastError = '';
        $data = $this->request('check', [
            'device_key' => $this->appSecret,
            'hwid' => self::getHWID(),
        ]);

        if (!empty($data['active'])) return true;
        $this->lastError = $data['message'] ?? 'Device deactivated by admin';
        return false;
    }

    public function register(string $deviceName = ''): bool
    {
        $this->lastError = '';
        $payload = [
            'device_key' => $this->appSecret,
            'hwid' => self::getHWID(),
        ];
        if ($deviceName) $payload['device_name'] = $deviceName;

        $data = $this->request('register', $payload);
        return !empty($data['active']);
    }
}
