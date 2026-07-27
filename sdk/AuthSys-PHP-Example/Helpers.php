<?php
/**
 * AuthSys PHP SDK - Helper functions
 *
 * Platform-specific utilities for HWID, hashing, and other helpers.
 */

function getHwid()
{
    try {
        $os = strtolower(PHP_OS);
        if (strpos($os, 'win') !== false) {
            $output = shell_exec('wmic csproduct get uuid 2>nul');
            if ($output) {
                $lines = array_filter(explode("\n", $output), 'trim');
                if (count($lines) > 1) {
                    $line = trim(end($lines));
                    return $line !== 'UUID' ? $line : 'UNKNOWN_HWID';
                }
            }
        } elseif (strpos($os, 'linux') !== false) {
            if (file_exists('/etc/machine-id')) {
                return trim(file_get_contents('/etc/machine-id'));
            }
            if (file_exists('/proc/sys/kernel/random/boot_id')) {
                return trim(file_get_contents('/proc/sys/kernel/random/boot_id'));
            }
        } elseif (strpos($os, 'darwin') !== false) {
            $output = shell_exec('ioreg -rd1 -c IOPlatformExpertDevice 2>/dev/null');
            if ($output) {
                $lines = explode("\n", $output);
                foreach ($lines as $line) {
                    if (strpos($line, 'IOPlatformUUID') !== false) {
                        $parts = explode('"', $line);
                        if (count($parts) >= 4) {
                            return $parts[3];
                        }
                    }
                }
            }
        }
    } catch (Exception $e) {}
    return 'UNKNOWN_PHP_HWID';
}

function hashString($input)
{
    return hash('sha256', $input);
}

function generateGuid()
{
    if (function_exists('com_create_guid')) {
        return trim(com_create_guid(), '{}');
    }
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

function isWindows()
{
    return strtolower(PHP_OS) === 'win32' || strpos(strtolower(PHP_OS), 'win') !== false;
}

function isLinux()
{
    return strpos(strtolower(PHP_OS), 'linux') !== false;
}

function isMacOS()
{
    return strpos(strtolower(PHP_OS), 'darwin') !== false;
}
