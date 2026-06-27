using System.Windows;
using AuthSys;

namespace AuthSysWPF
{
    public partial class MainWindow : Window
    {
        private AuthSysClient _auth;

        public MainWindow()
        {
            InitializeComponent();
            _auth = new AuthSysClient("your_app_secret", "1.0.0");
            _ = InitAsync();
        }

        private async System.Threading.Tasks.Task InitAsync()
        {
            await _auth.InitAsync("WPF-App");
            if (!_auth.Initialized)
            {
                txtOutput.Text = $"Init failed: {_auth.LastError}";
            }
            else
            {
                lblStatus.Text = "Initialized successfully";
            }
        }

        private async void BtnLogin_Click(object sender, RoutedEventArgs e)
        {
            await _auth.LoginAsync(txtUsername.Text, txtPassword.Password);

            if (!string.IsNullOrEmpty(_auth.SessionToken))
            {
                txtOutput.Text = $"Welcome {_auth.Username}!";
                lblStatus.Text = "Logged in";
            }
            else
            {
                txtOutput.Text = $"Login failed: {_auth.LastError}";
            }
        }

        private async void BtnLicenseLogin_Click(object sender, RoutedEventArgs e)
        {
            await _auth.LicenseLoginAsync(txtLicenseKey.Text);

            if (!string.IsNullOrEmpty(_auth.SessionToken))
            {
                txtOutput.Text = $"Welcome {_auth.Username}!";
                lblStatus.Text = "License login success";
            }
            else
            {
                txtOutput.Text = $"License login failed: {_auth.LastError}";
            }
        }

        private async void BtnRegister_Click(object sender, RoutedEventArgs e)
        {
            await _auth.RegisterAsync(txtRegUsername.Text, txtRegPassword.Password, txtLicenseKey.Text);
            txtOutput.Text = string.IsNullOrEmpty(_auth.LastError) ? "Registration successful!" : $"Registration failed: {_auth.LastError}";
        }
    }
}
