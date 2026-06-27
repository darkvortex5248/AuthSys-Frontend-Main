using UnityEngine;
using UnityEngine.UI;
using AuthSys;

public class AuthSysLogin : MonoBehaviour
{
    public InputField usernameField;
    public InputField passwordField;
    public InputField licenseKeyField;
    public Text outputText;
    public Button loginButton;
    public Button registerButton;

    private AuthSysClient _auth;

    void Start()
    {
        _auth = new AuthSysClient("your_app_secret", "1.0.0");
        StartCoroutine(_auth.InitAsync("Unity-App", (success) =>
        {
            if (!success)
                outputText.text = "Init failed: " + _auth.LastError;
        }));

        loginButton.onClick.AddListener(OnLogin);
        registerButton.onClick.AddListener(OnRegister);
    }

    void OnLogin()
    {
        if (!_auth.Initialized)
        {
            outputText.text = "Not initialized";
            return;
        }

        StartCoroutine(_auth.LoginAsync(usernameField.text, passwordField.text, (success) =>
        {
            if (success)
                outputText.text = "Welcome " + _auth.Username + "!";
            else
                outputText.text = "Login failed: " + _auth.LastError;
        }));
    }

    void OnRegister()
    {
        StartCoroutine(_auth.RegisterAsync(usernameField.text, passwordField.text, licenseKeyField.text, (success) =>
        {
            outputText.text = success ? "Registered!" : "Failed: " + _auth.LastError;
        }));
    }
}
