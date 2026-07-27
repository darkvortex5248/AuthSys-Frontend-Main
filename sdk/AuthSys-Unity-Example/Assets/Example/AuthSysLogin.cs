using UnityEngine;
using UnityEngine.UI;
using AuthSys;

public class AuthSysLogin : MonoBehaviour
{
    public InputField usernameInput;
    public InputField passwordInput;
    public InputField licenseKeyInput;
    public Button loginButton;
    public Button licenseLoginButton;
    public Button verifyButton;
    public Button logoutButton;
    public Text statusText;

    private AuthSys.AuthSys auth;

    void Start()
    {
        var options = new AuthSysOptions("YOUR_APP_SECRET")
        {
            appName = "MyApplication",
            version = "1.0.0",
            enableLogging = true
        };
        auth = new AuthSys.AuthSys(options);

        loginButton.onClick.AddListener(() => Login());
        licenseLoginButton.onClick.AddListener(() => LicenseLogin());
        verifyButton.onClick.AddListener(() => Verify());
        logoutButton.onClick.AddListener(() => Logout());

        auth.Init((success, response) =>
        {
            statusText.text = $"Init: {success}";
        });
    }

    void Login()
    {
        auth.Login(usernameInput.text, passwordInput.text, 86400, (response, code, error) =>
        {
            statusText.text = $"Login: {error}";
        });
    }

    void LicenseLogin()
    {
        auth.LicenseLogin(licenseKeyInput.text, 86400, (response, code, error) =>
        {
            statusText.text = $"License Login: {error}";
        });
    }

    void Verify()
    {
        auth.Verify((response, code, error) =>
        {
            statusText.text = $"Verify: {error}";
        });
    }

    void Logout()
    {
        auth.Logout();
        statusText.text = "Logged out";
    }
}
