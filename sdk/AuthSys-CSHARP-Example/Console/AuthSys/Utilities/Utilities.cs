using System;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using AuthSys.Models;
using AuthSys.Exceptions;

namespace AuthSys.Utilities
{
    public class HWIDHelper
    {
        private readonly HWIDMode _mode;
        private readonly ILogger _logger;
        private string? _cachedHWID;

        public HWIDHelper(HWIDMode mode, ILogger logger)
        {
            _mode = mode;
            _logger = logger;
        }

        public string GetHWID()
        {
            if (_cachedHWID != null) return _cachedHWID;

            try
            {
                string rawHWID;
                switch (_mode)
                {
                    case HWIDMode.Windows:
                        rawHWID = GetWindowsHWID();
                        break;
                    case HWIDMode.Linux:
                        rawHWID = GetLinuxHWID();
                        break;
                    case HWIDMode.MacOS:
                        rawHWID = GetMacOSHWID();
                        break;
                    case HWIDMode.Custom:
                        rawHWID = GetCustomHWID();
                        break;
                    default:
                        rawHWID = GetAutoHWID();
                        break;
                }

                _cachedHWID = HashHWID(rawHWID);
                _logger.Log(LogLevel.Debug, $"HWID generated: {_cachedHWID}");
                return _cachedHWID;
            }
            catch (Exception ex)
            {
                _logger.Log(LogLevel.Warning, $"HWID generation failed: {ex.Message}");
                return "UNKNOWN_HWID";
            }
        }

        private string GetAutoHWID()
        {
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                return GetWindowsHWID();
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
                return GetLinuxHWID();
            if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
                return GetMacOSHWID();
            return Environment.MachineName + Environment.UserName;
        }

        private string GetWindowsHWID()
        {
            try
            {
                var process = new System.Diagnostics.Process
                {
                    StartInfo = new System.Diagnostics.ProcessStartInfo
                    {
                        FileName = "wmic",
                        Arguments = "csproduct get UUID",
                        UseShellExecute = false,
                        RedirectStandardOutput = true,
                        CreateNoWindow = true
                    }
                };
                process.Start();
                string output = process.StandardOutput.ReadToEnd();
                process.WaitForExit();
                return output.Replace("UUID", "").Trim();
            }
            catch
            {
                return Environment.MachineName + Environment.UserName;
            }
        }

        private string GetLinuxHWID()
        {
            try
            {
                if (System.IO.File.Exists("/etc/machine-id"))
                    return System.IO.File.ReadAllText("/etc/machine-id").Trim();
                if (System.IO.File.Exists("/var/lib/dbus/machine-id"))
                    return System.IO.File.ReadAllText("/var/lib/dbus/machine-id").Trim();
            }
            catch { }
            return Environment.MachineName + Environment.UserName;
        }

        private string GetMacOSHWID()
        {
            try
            {
                var process = new System.Diagnostics.Process
                {
                    StartInfo = new System.Diagnostics.ProcessStartInfo
                    {
                        FileName = "ioreg",
                        Arguments = "-rd1 -c IOPlatformExpertDevice",
                        UseShellExecute = false,
                        RedirectStandardOutput = true,
                        CreateNoWindow = true
                    }
                };
                process.Start();
                string output = process.StandardOutput.ReadToEnd();
                process.WaitForExit();
                var match = System.Text.RegularExpressions.Regex.Match(output, "IOPlatformUUID.*?\"([^\"]+)\"");
                if (match.Success) return match.Groups[1].Value;
            }
            catch { }
            return Environment.MachineName + Environment.UserName;
        }

        private string GetCustomHWID()
        {
            return Environment.MachineName + Environment.UserName + Environment.OSVersion.VersionString;
        }

        private string HashHWID(string rawHWID)
        {
            using var sha = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(rawHWID);
            var hash = sha.ComputeHash(bytes);
            return Convert.ToBase64String(hash).Replace("/", "_").Replace("+", "-").TrimEnd('=');
        }
    }

    public interface ILogger
    {
        void Log(LogLevel level, string message);
    }

    public enum LogLevel
    {
        Debug,
        Info,
        Warning,
        Error
    }

    public class NullLogger : ILogger
    {
        public void Log(LogLevel level, string message) { }
    }

    public class ConsoleLogger : ILogger
    {
        public void Log(LogLevel level, string message)
        {
            var timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");
            var prefix = level switch
            {
                LogLevel.Debug => "[DEBUG]",
                LogLevel.Info => "[INFO]",
                LogLevel.Warning => "[WARN]",
                LogLevel.Error => "[ERROR]",
                _ => "[LOG]"
            };
            Console.WriteLine($"{timestamp} {prefix} {message}");
        }
    }

    public class RetryPolicy
    {
        private readonly int _maxRetries;
        private readonly int _delayMs;
        private readonly ILogger _logger;

        public RetryPolicy(int maxRetries, int delayMs, ILogger logger)
        {
            _maxRetries = maxRetries;
            _delayMs = delayMs;
            _logger = logger;
        }

        public async Task<T> ExecuteAsync<T>(Func<Task<T>> operation, System.Threading.CancellationToken ct = default)
        {
            Exception? lastException = null;

            for (int attempt = 0; attempt <= _maxRetries; attempt++)
            {
                try
                {
                    return await operation();
                }
                catch (Exception ex) when (IsRetryable(ex))
                {
                    lastException = ex;
                    _logger.Log(LogLevel.Warning, $"Attempt {attempt + 1} failed: {ex.Message}");

                    if (attempt < _maxRetries)
                    {
                        var delay = TimeSpan.FromMilliseconds(_delayMs * (attempt + 1));
                        await Task.Delay(delay, ct);
                    }
                }
            }

            throw new NetworkException($"Operation failed after {_maxRetries + 1} attempts", lastException);
        }

        private bool IsRetryable(Exception ex)
        {
            return ex is HttpRequestException ||
                   ex is TaskCanceledException ||
                   ex is TimeoutException;
        }
    }

    public class TokenManager
    {
        private readonly ILogger _logger;
        private string? _token;
        private DateTime? _expiresAt;

        public TokenManager(ILogger logger)
        {
            _logger = logger;
        }

        public string? Token => _token;
        public DateTime? ExpiresAt => _expiresAt;
        public bool HasToken => !string.IsNullOrEmpty(_token);

        public void SetToken(string token, DateTime? expiresAt)
        {
            _token = token;
            _expiresAt = expiresAt;
            _logger.Log(LogLevel.Debug, $"Token set, expires at: {expiresAt}");
        }

        public void UpdateFromVerify(DateTime? expiresAt)
        {
            _expiresAt = expiresAt;
            _logger.Log(LogLevel.Debug, $"Token expiry updated: {expiresAt}");
        }

        public void ClearToken()
        {
            _token = null;
            _expiresAt = null;
            _logger.Log(LogLevel.Debug, "Token cleared");
        }

        public bool IsExpired => _expiresAt.HasValue && _expiresAt.Value < DateTime.UtcNow.AddMinutes(1);
    }

    public class ConfigurationManager
    {
        public string Name { get; }
        public string Secret { get; }
        public string Version { get; }
        public string ApiUrl { get; }
        public bool IsInitialized { get; set; }
        public AppData? AppData { get; set; }

        public ConfigurationManager(AuthSysOptions options)
        {
            Name = options.Name;
            Secret = options.Secret;
            Version = options.Version;
            ApiUrl = options.ApiUrl.TrimEnd('/');
        }
    }

    public class AuthSysVersion
    {
        public const string Version = "2.0.0";
    }
}
