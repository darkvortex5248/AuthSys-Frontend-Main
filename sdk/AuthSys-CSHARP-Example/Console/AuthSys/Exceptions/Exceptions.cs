using System;

namespace AuthSys.Exceptions
{
    public class AuthSysException : Exception
    {
        public AuthSysException(string message) : base(message) { }
        public AuthSysException(string message, Exception inner) : base(message, inner) { }
    }

    public class AuthenticationException : AuthSysException
    {
        public AuthenticationException(string message) : base(message) { }
    }

    public class LicenseException : AuthSysException
    {
        public LicenseException(string message) : base(message) { }
    }

    public class RateLimitException : AuthSysException
    {
        public RateLimitException(string message) : base(message) { }
    }

    public class NetworkException : AuthSysException
    {
        public NetworkException(string message) : base(message) { }
        public NetworkException(string message, Exception inner) : base(message, inner) { }
    }

    public class ValidationException : AuthSysException
    {
        public ValidationException(string message) : base(message) { }
    }

    public class SessionExpiredException : AuthSysException
    {
        public SessionExpiredException(string message) : base(message) { }
    }

    public class HWIDException : AuthSysException
    {
        public HWIDException(string message) : base(message) { }
    }

    public class VersionMismatchException : AuthSysException
    {
        public VersionMismatchException(string message) : base(message) { }
    }

    public class CloudflareException : AuthSysException
    {
        public CloudflareException(string message) : base(message) { }
    }

    public class MaintenanceException : AuthSysException
    {
        public MaintenanceException(string message) : base(message) { }
    }

    public class TwoFactorRequiredException : AuthSysException
    {
        public TwoFactorRequiredException(string message) : base(message) { }
    }

    public class ApiException : AuthSysException
    {
        public int StatusCode { get; }
        public string ResponseBody { get; }

        public ApiException(string message, int statusCode, string responseBody) : base(message)
        {
            StatusCode = statusCode;
            ResponseBody = responseBody;
        }
    }
}
