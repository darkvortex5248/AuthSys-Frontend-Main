using System;

namespace AuthSys
{
    public class SessionExpiredEventArgs : EventArgs
    {
    }

    public class VersionUpdateEventArgs : EventArgs
    {
        public string RequiredVersion { get; set; } = "";
        public string Message { get; set; } = "";
        public bool IsRequired { get; set; }
    }

    public class LogEventArgs : EventArgs
    {
        public Utilities.LogLevel Level { get; set; }
        public string Message { get; set; } = "";
    }
}
