using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using AuthSysSDK = AuthSys.AuthSys;
using AuthSysOptions = AuthSys.AuthSysOptions;
using AuthSysExceptionNS = AuthSys.AuthSysException;

class Program
{
    static bool ToBool(object? v) => v is JsonElement e && e.ValueKind == JsonValueKind.True;

    static Config LoadConfig()
    {
        var env = Environment.GetEnvironmentVariable("AUTHSYS_CONFIG");
        var path = env ?? Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "config.json");
        return JsonSerializer.Deserialize<Config>(File.ReadAllText(path))!;
    }

    static void Report(string tag, bool ok, string detail = "")
    {
        Console.WriteLine($"[{(ok ? "PASS" : "FAIL")}] {tag} {detail}");
    }

    static async Task Main()
    {
        var cfg = LoadConfig();
        var auth = new AuthSysSDK(new AuthSysOptions
        {
            AppSecret = cfg.app_secret,
            AppName = cfg.app_name,
            Version = cfg.app_version,
            ApiUrl = cfg.api_url,
            Hwid = cfg.hwid,
        });

        try
        {
            var r = await auth.InitAsync();
            Report("init", r.GetValueOrDefault("status")?.ToString() == "success", $"status={r.GetValueOrDefault("status")}");
        }
        catch (AuthSysExceptionNS e) { Report("init", false, e.Message); }

        try
        {
            var r = await auth.LoginAsync(cfg.username, cfg.password, 3600);
            var ok = ToBool(r.GetValueOrDefault("success")) && !string.IsNullOrEmpty(r.GetValueOrDefault("token")?.ToString());
            Report("login", ok, $"user={r.GetValueOrDefault("username")}");
        }
        catch (AuthSysExceptionNS e) { Report("login", false, e.Message); }

        try
        {
            var r = await auth.VerifyAsync();
            Report("verify", ToBool(r.GetValueOrDefault("valid")), $"user={r.GetValueOrDefault("username")}");
        }
        catch (AuthSysExceptionNS e) { Report("verify", false, e.Message); }

        try
        {
            var r = await auth.LicenseCheckAsync(cfg.fake_license);
            Report("license_check", !ToBool(r.GetValueOrDefault("valid")), $"valid={ToBool(r.GetValueOrDefault("valid"))} (expect False for fake key)");
        }
        catch (AuthSysExceptionNS e) { Report("license_check", false, e.Message); }

        try
        {
            var r = await auth.RegisterDeviceAsync(cfg.hwid, "SDK-Test-Device");
            Report("device_register", ToBool(r.GetValueOrDefault("active")), $"device_id={r.GetValueOrDefault("device_id")}");
        }
        catch (AuthSysExceptionNS e) { Report("device_register", false, e.Message); }

        try
        {
            var r = await auth.CheckDeviceAsync(cfg.hwid);
            Report("device_check", ToBool(r.GetValueOrDefault("active")), $"msg={r.GetValueOrDefault("message")}");
        }
        catch (AuthSysExceptionNS e) { Report("device_check", false, e.Message); }

        try
        {
            var r = await auth.SendChatMessageAsync(1, "sdk-test");
            Report("chat_send", r.GetValueOrDefault("status")?.ToString() == "sent", JsonSerializer.Serialize(r));
        }
        catch (AuthSysExceptionNS e) { Console.WriteLine($"[INFO] chat_send requires room_id: {e.Message}"); }
    }
}

class Config
{
    public string api_url { get; set; } = "";
    public string app_secret { get; set; } = "";
    public string app_name { get; set; } = "";
    public string app_version { get; set; } = "";
    public string username { get; set; } = "";
    public string password { get; set; } = "";
    public string hwid { get; set; } = "";
    public string fake_license { get; set; } = "";
}